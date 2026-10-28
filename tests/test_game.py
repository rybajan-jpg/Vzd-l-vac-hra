"""Automatické testy hry Vyšší, nebo nižší (Playwright, headless Chromium)."""
import sys, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765/"
SHOTS = sys.argv[2] if len(sys.argv) > 2 else "."
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))

def overlap(a, b):
    return not (a["x"]+a["width"] <= b["x"] or b["x"]+b["width"] <= a["x"] or a["y"]+a["height"] <= b["y"] or b["y"]+b["height"] <= a["y"])

with sync_playwright() as p:
    br = p.chromium.launch()
    # ---------- desktop ----------
    ctx = br.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
    page.goto(BASE); page.wait_for_selector(".cat")
    cats = page.eval_on_selector_all(".cat", "els => els.map(e => e.dataset.cat)")
    check("menu: 8 okruhů", len(cats) == 8, str(cats))
    check("menu: denní výzva", page.is_visible("#daily"))
    check("menu: verze 0.3.0", "Verze 0.3.0" in page.inner_text(".foot"))

    for cat in cats:
        page.evaluate("renderMenu()")
        page.click(f"#cat-{cat}")
        page.wait_for_selector("#hi")
        # správná odpověď podle dat
        correct_hi = page.evaluate("(()=>{const c=CATS[S.cat];return c.items[S.right][2]>c.items[S.left][2]})()")
        page.click("#hi" if correct_hi else "#lo")
        page.wait_for_selector("#factbox:not([hidden])")
        fact = page.inner_text("#factbox")
        check(f"{cat}: zajímavost po správném tipu", "Věděl jsi" in fact.replace("VĚDĚL JSI","Věděl jsi") and "Správně" in fact, fact[:80])
        score = page.evaluate("S.score")
        check(f"{cat}: přičtené body", score > 0, str(score))
        page.keyboard.press("Enter")
        page.wait_for_selector("#hi:not([disabled])")
        check(f"{cat}: další kolo po Enteru", page.evaluate("S.count") == 1)
        # schválně špatná odpověď
        correct_hi = page.evaluate("(()=>{const c=CATS[S.cat];return c.items[S.right][2]>c.items[S.left][2]})()")
        page.click("#lo" if correct_hi else "#hi")
        page.wait_for_selector("#factbox:not([hidden])")
        check(f"{cat}: chyba ukáže 'Vedle'", "Vedle" in page.inner_text("#factbox"))
        page.click("#next")
        page.wait_for_selector(".over")
        check(f"{cat}: obrazovka konce hry", "body" in page.inner_text(".over").lower() and page.is_visible("#again"))

    # ---------- časovač ----------
    page.evaluate("renderMenu()"); page.click("#cat-hory"); page.wait_for_selector("#hi")
    page.evaluate("S.deadline = performance.now() - 1")
    page.wait_for_selector("#factbox:not([hidden])", timeout=3000)
    check("časovač: vypršení = 'Došel čas'", "Došel čas" in page.inner_text("#factbox"))

    # ---------- sdílení ----------
    page.evaluate("renderMenu()"); page.click("#cat-filmy"); page.wait_for_selector("#hi")
    page.evaluate("S.count=3; S.score=42; S.reason='wrong'; renderOver()")
    # a) prohlížeč s nabídkou Sdílet
    page.evaluate("window.__shared=null; navigator.share = async (d)=>{window.__shared=d.text}; navigator.canShare=()=>true")
    page.click("#share"); page.wait_for_timeout(200)
    shared = page.evaluate("window.__shared")
    check("sdílení: nabídka Sdílet dostane text", shared and "42 bodů" in shared and "http" in shared, str(shared))
    # b) bez Sdílet, schránka zakázaná -> záložní kopírování nebo ruční okno
    page.evaluate("""delete navigator.share; navigator.share=undefined;
      Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('blocked'))},configurable:true});
      document.execCommand = ()=>false;""")
    page.click("#share"); page.wait_for_timeout(300)
    check("sdílení: když vše selže, ukáže text k ručnímu zkopírování", page.is_visible("#sharetext") and "42 bodů" in page.input_value("#sharetext"))
    page.click("#shareclose")
    # c) schránka funguje
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:(t)=>{window.__clip=t;return Promise.resolve()}},configurable:true})")
    page.click("#share"); page.wait_for_timeout(300)
    check("sdílení: schránka dostane text", "42 bodů" in (page.evaluate("window.__clip") or ""))

    # ---------- denní výzva ----------
    page.evaluate("localStorage.clear(); renderMenu()")
    page.click("#daily"); page.wait_for_selector("#hi")
    cats_seen = set()
    for i in range(10):
        cats_seen.add(page.evaluate("S.cat"))
        check_round = page.evaluate("S.idx") == i
        if not check_round: check(f"denní: kolo {i+1}", False)
        page.click("#hi" if i % 2 == 0 else "#lo")
        page.wait_for_selector("#factbox:not([hidden])")
        page.click("#next")
        if i < 9: page.wait_for_selector("#hi:not([disabled])")
    page.wait_for_selector(".grid")
    check("denní: 10 výsledků v mřížce", page.eval_on_selector_all(".grid i", "e=>e.length") == 10)
    check("denní: rekapitulace 10 kol", page.eval_on_selector_all(".recap li", "e=>e.length") == 10)
    check("denní: mix okruhů (aspoň 5 různých)", len(cats_seen) >= 5, str(cats_seen))
    stored = page.evaluate("JSON.parse(localStorage.getItem('vn-daily-'+pragueDate()))")
    check("denní: výsledek uložen", stored and stored["done"] and len(stored["results"]) == 10)
    page.reload(); page.wait_for_selector("#daily")
    check("denní: menu ukazuje dnešní výsledek", "z 10" in page.inner_text("#daily"))
    page.click("#daily"); page.wait_for_selector(".grid")
    check("denní: nejde odehrát znovu, ukáže výsledek", page.is_visible(".grid"))
    same = page.evaluate("JSON.stringify(buildDaily('2026-10-29'))==JSON.stringify(buildDaily('2026-10-29'))")
    check("denní: stejná sada pro všechny (deterministická)", same)
    check("bez chyb v konzoli (desktop)", not errors, "; ".join(errors[:3]))
    ctx.close()

    # ---------- mobil ----------
    ctx = br.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    merr = []
    page.on("pageerror", lambda e: merr.append(str(e)))
    page.goto(BASE); page.wait_for_selector(".cat")
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("mobil: bez vodorovného posouvání (menu)", sw <= 375, str(sw))
    page.screenshot(path=f"{SHOTS}/m_menu.png")
    bad = []
    for cat in cats:
        page.evaluate(f"startGame('{cat}')"); page.wait_for_selector("#hi")
        for _ in range(4):
            vs = page.locator("#vs").bounding_box()
            lab = page.locator("#rightCard .label").bounding_box()
            nm_l = page.locator(".card.left .value").bounding_box()
            if overlap(vs, lab) or overlap(vs, nm_l): bad.append(cat)
            if page.evaluate("document.documentElement.scrollWidth") > 375: bad.append(cat+":sirka")
            page.evaluate("S.left=Math.floor(Math.random()*CATS[S.cat].items.length);S.right=pickNext([S.left]);renderRound()")
    check("mobil: VS se nepřekrývá s 'Hádej' ani s hodnotou (všechny okruhy)", not bad, str(bad))
    page.evaluate("startGame('kraje')"); page.wait_for_selector("#hi")
    page.screenshot(path=f"{SHOTS}/m_round.png")
    page.click("#hi"); page.wait_for_selector("#factbox:not([hidden])"); page.wait_for_timeout(500)
    page.screenshot(path=f"{SHOTS}/m_fact.png", full_page=True)
    check("bez chyb v konzoli (mobil)", not merr, "; ".join(merr[:3]))
    br.close()

ok = sum(1 for r in results if r[1])
for n, c, d in results:
    print(("OK   " if c else "FAIL ") + n + (f"  [{d}]" if (d and not c) else ""))
print(f"\n{ok}/{len(results)} testů prošlo")
