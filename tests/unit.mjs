/* RankMaker 순수 로직 테스트 — 의존성 없음.  실행: node tests/unit.mjs
 *
 * index.html 의 <script> 를 그대로 읽어 최소 DOM 스텁 위에서 평가한 뒤,
 * 안에 정의된 함수·정규식을 직접 호출해 확인한다. 별도 사본을 두지 않으므로
 * index.html 을 고치면 이 테스트가 곧바로 그 코드를 검사한다.
 *
 * 데이터는 main 에 있는 예제 주제(topics/ex_*)만 쓴다.
 * 개인 주제는 브랜치마다 다르고 커밋에서 빠질 수도 있으므로 절대 읽지 않는다.
 *
 * 여기서 다루는 것은 브라우저 없이 판정 가능한 것뿐이다.
 * 폴더 연결·파일 저장·캔버스·드래그처럼 사람이 봐야 하는 것은 tests/SCENARIOS.md 에 있다.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS = join(ROOT, "topics");

// main 에 실려 있는 예제 주제. 여기 없는 주제는 테스트가 건드리지 않는다.
const EXAMPLES = ["ex_image_boardgame", "ex_chzzk_vtuber", "ex_youtube_kpop", "ex_라면", "ex_image_source"];

/* ---------- 최소 DOM 스텁 ----------
   앱 스크립트가 로드 시점에 건드리는 것만 채운다. 새로 필요한 게 생기면 여기에 추가한다. */
function el() {
  return {
    style: {}, dataset: {}, children: [], hidden: false,
    textContent: "", innerHTML: "", value: "", src: "", href: "", className: "",
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    append() {}, appendChild() {}, prepend() {}, remove() {}, click() {}, focus() {},
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    addEventListener() {}, removeEventListener() {}, contains: () => false,
    querySelector: () => el(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
    showModal() {}, close() {}, getContext: () => null, toBlob() {},
  };
}

const store = new Map();
const sandbox = {
  console,
  document: {
    documentElement: el(), body: el(), head: el(),
    querySelector: () => el(), querySelectorAll: () => [],
    createElement: () => el(), createElementNS: () => el(),
    addEventListener() {}, removeEventListener() {},
  },
  localStorage: {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  addEventListener() {}, removeEventListener() {},
  indexedDB: { open: () => ({}) },
  requestAnimationFrame: fn => fn(),
  setTimeout, clearTimeout, setInterval, clearInterval,
  URL: Object.assign(URL, { createObjectURL: () => "blob:stub", revokeObjectURL() {} }),
  Image: class { set src(_) {} },
  fetch: () => Promise.reject(new Error("네트워크는 테스트하지 않는다")),
  alert() {}, confirm: () => false, prompt: () => null,
  navigator: { userAgent: "node" },
  location: { protocol: "https:", href: "https://test/", hostname: "test" },
  Blob: class { constructor() { this.size = 0; this.type = ""; } },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const html = readFileSync(join(ROOT, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) throw new Error("index.html 에서 스크립트를 찾지 못했습니다");

const ctx = vm.createContext(sandbox);
vm.runInContext(scripts.join("\n;\n"), ctx, { filename: "index.html" });

// const/let 로 선언된 것은 전역 객체의 속성이 아니므로 컨텍스트 안에서 평가해 꺼낸다
const app = name => vm.runInContext(name, ctx);
const parseInfo = app("parseInfo"), thumbOf = app("thumbOf"), isMetaLine = app("isMetaLine");
const IMG_EXT = app("IMG_EXT"), IMAGES_DIR = app("IMAGES_DIR"), PODIUM_RE = app("PODIUM_RE");

/* ---------- 조촐한 테스트 러너 ---------- */
let pass = 0, fail = 0, skip = 0, group = "";
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const describe = async (name, fn) => { group = name; await fn(); };   // 비동기 블록도 받는다
function it(what, got, want) {
  if (eq(got, want)) { pass++; return; }
  fail++;
  console.log(`  ✗ ${group} — ${what}`);
  console.log(`      기대: ${JSON.stringify(want)}`);
  console.log(`      실제: ${JSON.stringify(got)}`);
}
const ok = (what, cond) => it(what, !!cond, true);
function skipped(why) { skip++; console.log(`  · 건너뜀 — ${why}`); }

/* ---------- 예제 주제 읽기 ---------- */
function example(name) {
  const dir = join(TOPICS, name);
  const md = join(dir, "info.md");
  if (!existsSync(md)) return null;
  const info = parseInfo(readFileSync(md, "utf8"));
  const files = new Set(readdirSync(dir));
  return { name, dir, info, files };
}

// loadTopic 이 항목마다 무엇을 쓸지 정하는 순서를 그대로 따라간다.
// 공용 images 폴더 → info.md 의 이미지 주소 → 이름 카드.
// 주제 폴더의 그림은 쓰지 않는다 (podium.* 만 예외).
function resolve(ex, item) {
  if (existsSync(join(TOPICS, IMAGES_DIR, item))) return "shared";
  return thumbOf(ex.info.items[item]) ? "remote" : "card";
}
const imageItems = ex => Object.keys(ex.info.items).filter(n => IMG_EXT.test(n));
const strayImages = ex => [...ex.files].filter(f => IMG_EXT.test(f) && !PODIUM_RE.test(f));

/* ================= 예제 주제가 앱이 기대하는 모양인가 ================= */
describe("예제 주제 공통", () => {
  for (const name of EXAMPLES) {
    const ex = example(name);
    if (!ex) { skipped(`${name} 이(가) 없습니다`); continue; }
    ok(`${name} — 항목이 있다`, imageItems(ex).length > 0);
    ok(`${name} — global 설명이 있다`, ex.info.global.length > 0);
    ok(`${name} — 모든 항목에 설명이 붙어 있다`,
      imageItems(ex).every(n => ex.info.items[n].length > 0));
    ok(`${name} — 모든 항목이 이미지 확장자다`,
      Object.keys(ex.info.items).every(n => IMG_EXT.test(n)));
    // 그림은 전부 topics/images 에 모아 둔다 — 주제 폴더에는 두지 않는다
    it(`${name} — 주제 폴더에 그림이 남아 있지 않다`, strayImages(ex), []);
  }
});

/* ================= 이미지가 실제 파일인 예제 ================= */
describe("ex_image_boardgame — 그림 파일이 있는 예제", () => {
  const ex = example("ex_image_boardgame");
  if (!ex) return skipped("예제가 없습니다");
  const items = imageItems(ex);

  ok("항목이 여럿이다", items.length >= 10);
  it("모든 항목이 공용 폴더의 파일로 해결된다",
    items.filter(n => resolve(ex, n) !== "shared"), []);
  it("BGG 게임 페이지 주소는 썸네일로 쓰지 않는다",
    items.filter(n => thumbOf(ex.info.items[n])), []);
  ok("설명에 BGG 링크가 남아 있다",
    items.some(n => ex.info.items[n].some(l => l.text.includes("boardgamegeek.com/boardgame/"))));
  ok("BGG 게임 링크는 설명에서 감추지 않는다",
    !isMetaLine("🔗 https://boardgamegeek.com/boardgame/382350/lost-ruins-of-arnak-the-missing-expedition"));
  it("주제 이름을 주석에서 읽는다", ex.info.name, "보드게임 월드컵 (이미지 예제)");
});

/* ================= 주소로만 이미지가 있는 예제 ================= */
describe("ex_chzzk_vtuber — 파일 없이 주소로 뜨는 예제", () => {
  const ex = example("ex_chzzk_vtuber");
  if (!ex) return skipped("예제가 없습니다");
  const items = imageItems(ex);

  ok("항목이 있다", items.length > 0);
  it("모두 주소로 해결된다", items.filter(n => resolve(ex, n) !== "remote"), []);
  ok("뽑아낸 주소가 이미지다",
    items.every(n => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(thumbOf(ex.info.items[n]))));
  ok("썸네일 주소는 설명에서 감춘다",
    items.every(n => ex.info.items[n].filter(l => l.text.includes("pstatic.net")).every(l => isMetaLine(l.text))));
});

/* ================= 주소가 없어 이름 카드로 가는 예제 ================= */
describe("ex_라면 · ex_youtube_kpop — 이름 카드로 가는 예제", () => {
  for (const name of ["ex_라면", "ex_youtube_kpop"]) {
    const ex = example(name);
    if (!ex) { skipped(`${name} 이(가) 없습니다`); continue; }
    const items = imageItems(ex);
    it(`${name} — 썸네일 주소가 없다`, items.filter(n => thumbOf(ex.info.items[n])), []);
    it(`${name} — 이름 카드로 해결된다`, items.filter(n => resolve(ex, n) !== "card"), []);
  }
  const yt = example("ex_youtube_kpop");
  if (yt) ok("유튜브 주소는 설명에서 감춘다", isMetaLine("🔗 https://youtu.be/U7mPqycQ0tQ"));
});

/* ================= 수동 시나리오용 준비물 =================
   tests/SCENARIOS.md 가 그대로 쓰는 주제다. 여섯 항목이 각각 다른 출처를 대표한다.
   4번·6번은 시나리오를 돌리는 동안 파일이 생길 수 있으므로 '어떻게 해결되는가'가 아니라
   'info.md 가 무엇을 선언하고 있는가'를 확인한다 — 그쪽이 흔들리지 않는다. */
describe("ex_image_source — 시나리오 준비물", () => {
  const ex = example("ex_image_source");
  if (!ex) return skipped("준비물 주제가 없습니다");
  const items = imageItems(ex);
  const src = n => thumbOf(ex.info.items[n]);

  it("항목이 여섯 개다", items.length, 6);
  // save.json · cup.save.json 은 쓰다 보면 생긴다 — 그림만 없으면 된다
  it("주제 폴더에 info.md 와 저장 파일 말고는 없다",
    [...ex.files].filter(f => !["info.md", "save.json", "cup.save.json"].includes(f)), []);

  // 이 예제 전용 그림이다 — 다른 주제의 그림이 바뀌어도 흔들리지 않는다
  const own = ["1 그림 있음.png", "2 그림 있음.png", "3 그림 있음.png"];
  const others = EXAMPLES.filter(n => n !== "ex_image_source").map(example).filter(Boolean);
  for (const n of own) {
    it(`${n} 은 공용 폴더에서 해결된다`, resolve(ex, n), "shared");
    it(`${n} 을 쓰는 다른 예제가 없다`, others.filter(o => o.info.items[n] !== undefined).map(o => o.name), []);
  }

  it("그림 없음 항목엔 주소가 없다", src("4 그림 없음.svg"), null);
  it("그림 없음 항목은 이름 카드로 해결된다", resolve(ex, "4 그림 없음.svg"), "card");
  ok("CORS 를 주지 않는 호스트 항목", (src("5 주소 CORS 미허용.jpg") || "").includes("cf.geekdo-images.com"));
  ok("CORS 를 주는 호스트 항목", (src("6 주소 CORS 허용.png") || "").includes("raw.githubusercontent.com"));
  ok("그 주소는 이미지 확장자로 끝난다", /\.png$/i.test(src("6 주소 CORS 허용.png") || ""));

  /* 저장이 없을 때의 표시 순서는 파일명 순이다(loadTopic).
     Poster(Insta)는 상위 3개만 쓰므로 그 셋은 모두 그림이 있어야 F9 를 볼 수 있다.
     번호 접두어가 그 순서를 만든다 — 이름을 바꾸면 조용히 깨지므로 여기서 붙잡는다. */
  const byName = items.slice().sort();
  it("파일명 순 상위 3개가 전용 그림 셋이다", byName.slice(0, 3), own);
  ok("4위 이하에 주소로만 있는 항목이 있다",
    byName.slice(3).some(n => resolve(ex, n) === "remote"));
});

/* ================= 공용 이미지 원본 =================
   연결하는 길이 셋(폴더 핸들·드래그·webkitdirectory)이라도 찾는 곳은 하나여야 한다.
   가짜 폴더 핸들을 물려 "폴더를 몇 번 훑는지"까지 본다. */
await describe("공용 이미지 원본", async () => {
  app(`
    scanCount = 0;
    fakeDir = {
      values: async function* () {
        scanCount++;
        yield { kind: "file", name: "그림.png", getFile: async () => ({ size: 10, type: "image/png" }) };
        yield { kind: "directory", name: "무시할폴더" };
      },
    };
    useImageSource({ getDirectoryHandle: async n => { if (n !== "images") throw 0; return fakeDir; } }, null);
  `);

  ok("이름으로 파일을 찾는다", !!await app(`sharedImageFile("그림.png")`));
  it("없는 이름은 null", await app(`sharedImageFile("없는것.png")`), null);
  it("하위 폴더는 그림이 아니다", await app(`sharedImageFile("무시할폴더")`), null);
  await app(`Promise.all(["그림.png", "없는것.png", "또없음.jpg"].map(n => sharedImageFile(n)))`);
  it("항목이 몇 개든 폴더는 한 번만 훑는다", app("scanCount"), 1);
  await app("imageTable(true)");
  it("새로 고치라 하면 다시 훑는다", app("scanCount"), 2);

  // 읽기 전용 연결 — 미리 읽어둔 File 표를 그대로 쓰고, 다시 훑을 곳이 없다
  app(`useImageSource(null, new Map([["미리.png", { size: 5, type: "image/png" }]]));`);
  ok("미리 읽어둔 파일을 쓴다", !!await app(`sharedImageFile("미리.png")`));
  await app("imageTable(true)");
  ok("새로 고쳐도 표가 날아가지 않는다", !!await app(`sharedImageFile("미리.png")`));
  it("읽기 전용에서는 폴더를 훑지 않는다", app("scanCount"), 2);
});

/* ================= 검색 범위 =================
   기본은 아이템명만, 'Details' 를 켜면 설명까지. 초성도 같은 범위를 따른다. */
describe("검색", () => {
  app(`
    render = () => {}; scheduleSave = () => {};
    queryBox = { value: "" };
    cur = {
      name: "t", dirHandle: null,
      info: { global: [], items: {} },
      save: { tierSizes: [], tierNames: {}, checks: {} },
      items: [],
      view: { mode: "grid", columns: 3, tierSize: 72 },
    };
    // 검색어는 입력칸에서 읽으므로 그 칸만 가로챈다
    origQuery = document.querySelector;
    document.querySelector = sel => (sel === "#searchInput" ? queryBox : origQuery(sel));
    mkItem = (label, desc) => ({
      file: label + ".png", label,
      searchName: label.toLowerCase(), searchNameCho: choseong(label.toLowerCase()),
      searchAll: (label + " " + desc).toLowerCase(), searchAllCho: choseong((label + " " + desc).toLowerCase()),
    });
    가들링 = mkItem("가들링", "협력 게임 · 디자이너 Kristian");
    오를레앙 = mkItem("오를레앙", "가방빌딩 유로");
  `);
  const ask = (q, wide) => app(`(queryBox.value = ${JSON.stringify(q)}, searchDesc = ${!!wide},
    [matchesQuery(가들링), matchesQuery(오를레앙)])`);

  it("빈 검색어는 전부 통과", ask(""), [true, true]);
  it("아이템명으로 찾는다", ask("가들"), [true, false]);
  it("초성으로 찾는다", ask("ㄱㄷㄹ"), [true, false]);
  it("대소문자 구분 안 함", ask("KRISTIAN", true), [true, false]);

  it("기본은 설명을 보지 않는다", ask("협력"), [false, false]);
  it("설명 포함을 켜면 찾는다", ask("협력", true), [true, false]);
  it("설명의 초성도 켰을 때만", ask("ㅎㄹ"), [false, false]);
  it("설명 포함이면 초성도 넓어진다", ask("ㅎㄹ", true), [true, false]);

  it("다른 항목의 설명에 걸리지 않는다", ask("유로"), [false, false]);
  it("설명 포함이면 그 항목만", ask("유로", true), [false, true]);

  /* 하이라이트 — 붙은 자리를 [] 로 찍어 확인한다.
     초성으로 찾아도 원문의 같은 자리를 짚어야 한다. */
  app(`
    collect = () => ({ out: [], append(x) {
      this.out.push(typeof x === "string" ? x : (x.href ? x.textContent : "[" + x.textContent + "]"));
    }, toString() { return this.out.join(""); } });
    marked = (text, q, wide) => {
      queryBox.value = q; searchDesc = wide;
      const box = collect(); appendMarked(box, text); return box.toString();
    };
    markedLine = (text, q, wide) => {
      queryBox.value = q; searchDesc = wide;
      const box = collect(); appendWithLinks(box, text); return box.toString();
    };
  `);
  const marked = (t, q, w) => app(`marked(${JSON.stringify(t)}, ${JSON.stringify(q)}, ${!!w})`);

  it("검색어가 없으면 그대로", marked("가들링", ""), "가들링");
  it("맞은 자리에만 붙는다", marked("가들링", "들"), "가[들]링");
  it("초성도 같은 자리를 짚는다", marked("가들링", "ㄱㄷ"), "[가들]링");
  it("초성 세 글자", marked("가들링", "ㄱㄷㄹ"), "[가들링]");
  it("여러 번 나오면 전부", marked("가나가나", "가"), "[가]나[가]나");
  it("대소문자 상관없이", marked("Elwen, Mín", "elwen"), "[Elwen], Mín");
  it("없으면 원문 그대로", marked("가들링", "zzz"), "가들링");

  it("설명 포함이면 설명에도 붙는다",
    app(`markedLine("디자이너: Elwen", "elwen", true)`), "디자이너: [Elwen]");
  it("설명 포함이 아니면 설명엔 안 붙는다",
    app(`markedLine("디자이너: Elwen", "elwen", false)`), "디자이너: Elwen");
  it("주소는 링크 그대로 두고 건드리지 않는다",
    app(`markedLine("보기 https://a.com/x.jpg", "a.com", true)`), "보기 https://a.com/x.jpg");

  app("document.querySelector = origQuery;");   // 뒤 블록에 영향을 남기지 않는다
});

/* ================= 되돌리기 =================
   가짜 주제를 만들어 실제 배치 함수를 돌린다. 화면을 그리는 부분만 비워 둔다. */
describe("되돌리기", () => {
  const order = () => app("sorted().map(i => i.file)");
  const sizes = () => app("[...cur.save.tierSizes]");
  const depth = () => app("undoStack.length");
  const item = f => `cur.items.find(i => i.file === ${JSON.stringify(f)})`;
  const setup = () => app(`
    render = () => {}; scheduleSave = () => {}; flash = () => {};
    cur = {
      name: "t", dirHandle: null,
      info: { global: [], items: {} },
      save: { tierSizes: [2, 2], tierNames: {}, checks: {} },
      items: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"].map((f, i) => ({ file: f, label: f, url: "blob:x", ord: i })),
      view: { mode: "tier", columns: 3, tierSize: 72 },
    };
    undoStack = [];
    normalize();
  `);

  setup();
  it("시작 순서", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("시작 티어 크기", sizes(), [2, 2]);
  it("되돌릴 것이 없다", depth(), 0);

  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  it("d 를 1티어 맨 앞으로", order(), ["d.jpg", "a.jpg", "b.jpg", "c.jpg"]);
  it("티어 크기도 따라 바뀐다", sizes(), [3, 1]);
  it("한 단계 쌓였다", depth(), 1);

  app("undo()");
  it("순서가 돌아온다", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("티어 크기도 돌아온다", sizes(), [2, 2]);
  it("단계가 비었다", depth(), 0);

  app("undo()");
  it("빈 상태에서 눌러도 그대로", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("음수로 내려가지 않는다", depth(), 0);

  // 여러 단계
  setup();
  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  app(`moveToTier(${item("c.jpg")}, 0, 0)`);
  it("두 번 옮긴 결과", order(), ["c.jpg", "d.jpg", "a.jpg", "b.jpg"]);
  it("두 단계", depth(), 2);
  app("undo()");
  it("한 단계 되돌림", order(), ["d.jpg", "a.jpg", "b.jpg", "c.jpg"]);
  app("undo()");
  it("두 단계 되돌림", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);

  // 끝에서의 이동은 단계를 쌓지 않는다
  setup();
  app(`moveItem(${item("a.jpg")}, -1)`);
  it("맨 앞에서 위로 — 순서 그대로", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("맨 앞에서 위로 — 단계 없음", depth(), 0);
  app(`moveItem(${item("d.jpg")}, 1)`);
  it("맨 뒤에서 아래로 — 단계 없음", depth(), 0);
  app(`moveItem(${item("a.jpg")}, 1)`);
  it("실제 이동은 단계를 쌓는다", depth(), 1);
  it("이웃과 자리 교환", order(), ["b.jpg", "a.jpg", "c.jpg", "d.jpg"]);
  app("undo()");
  it("교환도 되돌아온다", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);

  // 체크 표시 — mutate() 를 거치면 UI 핸들러와 같은 경로를 탄다
  setup();
  app(`cur.save.checks["a.jpg"] = { "해봤음#0": false };`);
  app(`mutate(() => { cur.save.checks["a.jpg"]["해봤음#0"] = true; })`);
  it("체크가 켜졌다", app(`cur.save.checks["a.jpg"]["해봤음#0"]`), true);
  it("체크도 한 단계다", depth(), 1);
  app("undo()");
  it("체크도 되돌아온다", app(`cur.save.checks["a.jpg"]["해봤음#0"]`), false);

  // 티어 이름
  setup();
  app(`mutate(() => { cur.save.tierNames["0"] = "최고"; })`);
  app("undo()");
  it("티어 이름도 되돌아온다", app(`cur.save.tierNames["0"]`), undefined);

  // 아무것도 바꾸지 않은 동작은 단계를 쌓지 않는다 — mutate() 가 스스로 판단한다
  setup();
  app(`mutate(() => { cur.save.tierNames["0"] = "A"; })`);
  it("이름을 바꾸면 한 단계", depth(), 1);
  app(`mutate(() => { cur.save.tierNames["0"] = "A"; })`);
  it("같은 값으로 다시 써도 그대로", depth(), 1);
  app(`mutate(() => {})`);
  it("빈 동작도 그대로", depth(), 1);

  // 쌓이는 단계 수 상한
  setup();
  app(`for (let i = 0; i < ${app("UNDO_MAX")} + 20; i++) mutate(() => cur.save.tierNames["x"] = String(i));`);
  it("상한을 넘지 않는다", depth(), app("UNDO_MAX"));

  // 주제를 바꾸면 되돌리기도 비워진다 (loadTopic 이 하는 일)
  app("undoStack = []; syncUndo();");
  it("주제 전환 후 비어 있다", depth(), 0);
});

/* ================= info.md 문법 ================= */
describe("parseInfo", () => {
  const info = parseInfo([
    "// 내 순위표", "// dark", "// columns: 4",
    "# global", "- 공통 설명",
    "# 가들링.jpg", "- 👥 인원: 1 ~ 4", "+ 🏠 보유중", "",
    "# 공룡섬.png", "- ⭐ 7.65",
  ].join("\n"));

  it("주석에서 이름을 읽는다", info.name, "내 순위표");
  it("테마", info.theme, "dark");
  it("열 수", info.columns, 4);
  it("global 섹션", info.global.map(l => l.text), ["공통 설명"]);
  it("항목 목록", Object.keys(info.items), ["가들링.jpg", "공룡섬.png"]);
  it("'-' 는 필수 설명", info.items["가들링.jpg"][0], { text: "👥 인원: 1 ~ 4", extra: false });
  it("'+' 는 추가 설명", info.items["가들링.jpg"][1].extra, true);
  it("빈 줄은 무시", info.items["공룡섬.png"].length, 1);

  const empty = parseInfo("");
  it("빈 입력도 형태는 유지", [empty.name, empty.global.length, Object.keys(empty.items).length], [null, 0, 0]);
});

/* ================= 이미지 주소 인식 ================= */
describe("thumbOf", () => {
  const L = (...xs) => xs.map(text => ({ text, extra: false }));
  it("jpg", thumbOf(L("https://a.com/x/pic1.jpg")), "https://a.com/x/pic1.jpg");
  it("png", thumbOf(L("설명 https://a.com/a/b.png")), "https://a.com/a/b.png");
  it("webp", thumbOf(L("https://a.com/a.webp")), "https://a.com/a.webp");
  it("avif", thumbOf(L("https://a.com/a.avif")), "https://a.com/a.avif");
  it("쿼리스트링이 붙어도 인식", thumbOf(L("https://a.com/a.jpg?w=200")), "https://a.com/a.jpg?w=200");
  it("BGG 이미지 CDN 형식",
    thumbOf(L("https://cf.geekdo-images.com/aB__itemrep/img/x=/fit-in/246x300/filters:strip_icc()/pic8075053.jpg")),
    "https://cf.geekdo-images.com/aB__itemrep/img/x=/fit-in/246x300/filters:strip_icc()/pic8075053.jpg");
  it("첫 번째 주소를 쓴다", thumbOf(L("https://a.com/1.jpg", "https://b.com/2.png")), "https://a.com/1.jpg");
  it("이미지가 아닌 주소는 무시", thumbOf(L("https://boardgamegeek.com/boardgame/416059/gardlings")), null);
  it("주소가 없으면 null", thumbOf(L("👥 인원: 1 ~ 4")), null);
  it("빈 입력", thumbOf(null), null);
});

/* ================= 포스터 이미지 판정 ================= */
describe("isRemote — 포스터에 못 쓰는 이미지 가려내기", () => {
  const isRemote = app("isRemote");
  ok("http 주소", isRemote({ url: "http://a.com/a.jpg" }));
  ok("https 주소", isRemote({ url: "https://a.com/a.jpg" }));
  it("로컬 파일(blob:)", isRemote({ url: "blob:https://test/abc" }), false);
  it("이름 카드(data:)", isRemote({ url: "data:image/svg+xml;charset=utf-8,%3Csvg" }), false);
});

/* ================= 파일명 규칙 ================= */
describe("파일명 정규식", () => {
  const VIDEO_EXT = app("VIDEO_EXT");
  ok("jpg 는 이미지", IMG_EXT.test("가들링.jpg"));
  ok("대문자 확장자", IMG_EXT.test("A.PNG"));
  it("확장자 없으면 이미지 아님", IMG_EXT.test("가들링"), false);
  ok("podium.png 는 단상", PODIUM_RE.test("podium.png"));
  it("podium2.png 는 단상 아님", PODIUM_RE.test("podium2.png"), false);
  ok("mp4 는 영상", VIDEO_EXT.test("a.mp4"));
  it("공용 이미지 폴더 이름", IMAGES_DIR, "images");
});

/* ================= 초성 검색 ================= */
describe("choseong", () => {
  const choseong = app("choseong");
  it("한글을 초성으로", choseong("가들링"), "ㄱㄷㄹ");
  it("영문·숫자는 그대로", choseong("abc 123"), "abc 123");
  it("섞인 경우", choseong("쿠키런 hi"), "ㅋㅋㄹ hi");
});

/* ================= 이름 카드 ================= */
describe("textCardUri — 이미지가 없을 때의 대체 카드", () => {
  const uri = app("textCardUri")("가들링");
  ok("data URI 로 만든다", uri.startsWith("data:image/svg+xml"));
  ok("이름이 들어간다", decodeURIComponent(uri).includes("가들링"));
});

/* ---------- 결과 ---------- */
console.log(`\n${fail ? "✗ 실패" : "✓ 통과"} — ${pass}개 통과, ${fail}개 실패`
  + (skip ? `, ${skip}개 건너뜀` : ""));
process.exit(fail ? 1 : 0);
