// Testovi toka igre u pravom pregledniku (Playwright, iPhone emulacija, WebKit = Safarijev engine).
//
//   npm install            (dev ovisnost: playwright)
//   npx playwright install webkit
//   npm test
//
// Server se pokrene sam (lokalni server.mjs na portu 4399). Pravila toka su u docs/FLOW.md.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { webkit, devices } from "playwright";

const PORT = 4399;
const URL = `http://127.0.0.1:${PORT}/`;
let server, browser;

before(async () => {
  server = spawn(process.execPath, ["server.mjs"], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(URL)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await webkit.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

// svaki test je "nova osoba": prazan localStorage, iPhone 13
async function fresh(query = "?igra=scratch", device = "iPhone 13") {
  const ctx = await browser.newContext({ ...devices[device] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL + query);
  await page.waitForSelector("#coin:not([hidden])");
  page.errors = errors;
  page.ctx = ctx;
  return page;
}
const visible = (page, sel) => page.locator(sel).first().isVisible();
const cls = (page, sel) => page.locator(sel).first().getAttribute("class");
const pausedSong = (page) => page.evaluate(() => document.getElementById("audio").paused);
async function tapCoin(page) {
  const b = await page.locator("#coin").boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(200);
}
// jedan potez novčićem preko cijele folije, na visini `row` (0..1)
async function stroke(page, row) {
  const b = await page.locator("canvas.scratch").boundingBox();
  const y = b.y + 10 + row * (b.height - 20);
  await page.mouse.move(b.x + 6, y);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width - 6, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(80);
}
// ogrebi cijelu foliju: novčić se nakon svakog poteza sam vrati, pa se opet dodirne
async function scratchAll(page) {
  for (let i = 0; i < 24; i++) {
    if (!(await visible(page, "#player-box")) && (await visible(page, "canvas.scratch")) && (await visible(page, "#coin"))) {
      if ((await cls(page, "#coin")).includes("held") === false) await tapCoin(page);
      await stroke(page, i / 23);
    } else break;
  }
}

test("početni ekran: samo omot, novčić i jedna poruka", async () => {
  const p = await fresh();
  assert.ok(await visible(p, ".sleeve"));
  assert.ok(await visible(p, "#coin"));
  assert.equal((await p.locator("#game-text").textContent()).trim(), "dodirni novčić");
  assert.ok(!(await visible(p, "#tabs")), "jahači su skriveni tijekom igre");
  assert.ok(!(await visible(p, "#hint")), "trag se ne pokazuje na početku");
  assert.ok(!(await visible(p, "#after")), "poruka se ne vidi prije igre");
  assert.ok(!(await visible(p, "#player-box")), "kaseta se ne vidi prije igre");
  assert.ok(!/Tu noć|Prljavci/.test(await p.title()), "naslov pjesme nije u <title>");
  assert.deepEqual(p.errors, []);
});

test("klik po pozadini ne pokreće pjesmu dok je omot zaključan", async () => {
  const p = await fresh();
  for (const [x, y] of [[10, 500], [370, 300], [180, 780]]) await p.mouse.click(x, y);
  await p.waitForTimeout(600);
  assert.ok(await pausedSong(p));
  assert.ok(!(await visible(p, "#mini")), "mali player se ne vidi");
});

test("novčić: dodir ga podiže, puštanje vraća dolje, a on je uvijek na sredini", async () => {
  const p = await fresh();
  const centered = async () => {
    const b = await p.locator("#coin").boundingBox();
    const w = p.viewportSize().width;
    return Math.abs(b.x + b.width / 2 - w / 2) < 8;
  };
  assert.ok(await centered(), "na početku je na sredini");
  await tapCoin(p);
  assert.match(await cls(p, "#coin"), /held/);
  assert.equal((await p.locator("#game-text").textContent()).trim(), "sad grebi omot");
  await stroke(p, 0.3);
  assert.doesNotMatch(await cls(p, "#coin"), /held/, "nakon puštanja novčić je opet dolje");
  assert.ok(await centered(), "i dalje je na sredini");
  await tapCoin(p);
  assert.match(await cls(p, "#coin"), /held/, "može ga se ponovo uzeti");
});

test("bez novčića folija se ne grebe", async () => {
  const p = await fresh();
  const before = await p.locator("canvas.scratch").evaluate((c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data.filter((v, i) => i % 4 === 3 && v < 40).length);
  await stroke(p, 0.5);
  const after = await p.locator("canvas.scratch").evaluate((c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data.filter((v, i) => i % 4 === 3 && v < 40).length);
  assert.equal(after, before);
});

test("cijeli tok: ogrebi, premotaj, poruka, reakcija, spremi u kutiju", async () => {
  const p = await fresh();
  await scratchAll(p);
  await p.waitForSelector("#player-box", { state: "visible", timeout: 6000 });
  await p.waitForTimeout(1500);
  assert.ok(!(await visible(p, "#tabs")), "jahači su skriveni dok traje premotavanje");
  assert.ok(await pausedSong(p), "pjesma još ne svira prije premotavanja");

  // premotaj držanjem tipke unazad
  const r = await p.locator("#rew").boundingBox();
  await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await p.mouse.down();
  await p.waitForFunction(() => !document.getElementById("audio").paused, null, { timeout: 8000 });
  await p.mouse.up();

  assert.ok(await visible(p, "#after"), "poruka se pojavi nakon premotavanja");
  assert.ok(await visible(p, "#tabs"), "jahači se vrate");
  assert.ok((await p.locator("#note").textContent()).length > 3);

  // reakcija pa tajni P.S. / javi mu
  await p.locator("#react-row button").first().click();
  await p.waitForTimeout(300);

  // spremi u kutiju
  await p.locator("#collect").click();
  await p.waitForTimeout(1800);
  await p.locator('#tabs [data-view="box"]').click();
  assert.ok((await p.locator("#box-grid .mini").count()) >= 1, "kaseta je u kutiji");
  assert.deepEqual(p.errors, []);

  // sutradan (ponovno otvaranje): nema igre, odmah poruka
  await p.goto(URL);                      // bez ?igra=, kao kad opet skenira isti QR
  await p.waitForSelector("#after", { state: "visible" });
  assert.ok(!(await visible(p, "#coin")), "već otvorenu pjesmu ne treba ponovo ogrebati");
});

test("izlazi: „samo otvori” i „samo pusti” uvijek postoje", async () => {
  const p = await fresh();
  await p.locator("#skip").dispatchEvent("click");
  await p.waitForSelector("#deck", { state: "visible" });
  await p.waitForTimeout(600);
  await p.locator("#rewind-skip").dispatchEvent("click");
  await p.waitForSelector("#after", { state: "visible", timeout: 6000 });
  assert.ok(await visible(p, "#collect"));
});

test("nema bočnog pomicanja na 320 i 375 px", async () => {
  for (const [w, h] of [[320, 640], [375, 812]]) {
    const p = await fresh();
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(200);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.ok(!wide, `${w}px: nema bočnog pomicanja na početnom ekranu`);
    await p.locator("#skip").dispatchEvent("click");
    await p.waitForSelector("#player-box", { state: "visible" });
    await p.waitForTimeout(1500);
    assert.ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${w}px: ni na kaseti`);
  }
});
