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
  // 효과음 검증용 — 무엇을 만들었고 몇 번 틀었는지를 기록한다
  __sfxLog: [],
  Audio: class {
    constructor(src) { this.src = src; this.plays = 0; sandbox.__sfxLog.push(this); }
    play() { this.plays++; return Promise.resolve(); }
  },
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
const podiumOf = app("podiumOf");
const IMG_EXT = app("IMG_EXT"), IMAGES_DIR = app("IMAGES_DIR"), PODIUM_RE = app("PODIUM_RE");

/* ---------- 조촐한 테스트 러너 ---------- */
let pass = 0, fail = 0, skip = 0, group = "";
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// 비동기 블록도 받는다. 블록이 도중에 터지면 남은 it 이 조용히 사라지므로 실패로 잡는다.
const describe = async (name, fn) => {
  group = name;
  try { await fn(); }
  catch (e) { fail++; console.log(`  ✗ ${group} — 블록이 중단됨: ${e && e.message}`); }
};
function it(what, got, want) {
  if (eq(got, want)) { pass++; return; }
  fail++;
  console.log(`  ✗ ${group} — ${what}`);
  console.log(`      기대: ${JSON.stringify(want)}`);
  console.log(`      실제: ${JSON.stringify(got)}`);
}
const ok = (what, cond) => it(what, !!cond, true);
const NL = String.fromCharCode(10);
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

/* ================= 예제 주제 =================
   주제마다 그림이 어디서 오는지가 다르다. 기대를 표로 적고 한 번에 훑는다.
   kinds 는 그 주제에 허용되는 출처다 — 여기 없는 출처가 나오면 실패한다. */
const EXPECT = {
  ex_image_boardgame: { kinds: ["remote", "shared"], name: "보드게임 월드컵 (이미지 예제)", min: 10 },
  ex_chzzk_vtuber:    { kinds: ["remote"] },
  ex_youtube_kpop:    { kinds: ["card"] },
  "ex_라면":           { kinds: ["card"] },
  ex_image_source:    { kinds: ["shared", "remote", "card"] },   // 셋 다 나오는 준비물
};

describe("예제 주제", () => {
  for (const name of EXAMPLES) {
    const ex = example(name);
    if (!ex) { skipped(`${name} 이(가) 없습니다`); continue; }
    const want = EXPECT[name] || { kinds: ["shared", "remote", "card"] };
    const items = imageItems(ex);

    ok(`${name} — 항목이 ${want.min || 1}개 이상`, items.length >= (want.min || 1));
    ok(`${name} — global 설명이 있다`, ex.info.global.length > 0);
    ok(`${name} — 모든 항목에 설명이 붙어 있다`, items.every(n => ex.info.items[n].length > 0));
    ok(`${name} — 모든 항목이 이미지 확장자다`, Object.keys(ex.info.items).every(n => IMG_EXT.test(n)));
    // 그림은 전부 topics/images 에 모아 둔다 — 주제 폴더에는 두지 않는다
    it(`${name} — 주제 폴더에 그림이 남아 있지 않다`, strayImages(ex), []);
    it(`${name} — 그림 출처가 ${want.kinds.join("·")} 뿐이다`,
      [...new Set(items.map(n => resolve(ex, n)))].filter(k => !want.kinds.includes(k)), []);
    if (want.name) it(`${name} — 주제 이름을 주석에서 읽는다`, ex.info.name, want.name);
  }
});

/* 주소를 뽑아내는 규칙 — 게임 페이지 링크와 그림 주소를 섞지 않아야 한다 */
describe("예제 주제의 주소 처리", () => {
  const bg = example("ex_image_boardgame"), cz = example("ex_chzzk_vtuber"), yt = example("ex_youtube_kpop");
  if (bg) {
    const items = imageItems(bg);
    it("BGG 게임 페이지 주소는 썸네일로 오인하지 않는다",
      items.map(n => thumbOf(bg.info.items[n])).filter(u => u && /boardgamegeek\.com\/boardgame\//.test(u)), []);
    ok("설명에 BGG 링크가 남아 있다",
      items.some(n => bg.info.items[n].some(l => l.text.includes("boardgamegeek.com/boardgame/"))));
    ok("BGG 게임 링크는 설명에서 감추지 않는다",
      !isMetaLine("🔗 https://boardgamegeek.com/boardgame/382350/lost-ruins-of-arnak-the-missing-expedition"));
  }
  if (cz) {
    const items = imageItems(cz);
    ok("뽑아낸 주소가 이미지다",
      items.every(n => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(thumbOf(cz.info.items[n]))));
    ok("썸네일 주소는 설명에서 감춘다",
      items.every(n => cz.info.items[n].filter(l => l.text.includes("pstatic.net")).every(l => isMetaLine(l.text))));
  }
  if (yt) ok("유튜브 주소는 설명에서 감춘다", isMetaLine("🔗 https://youtu.be/U7mPqycQ0tQ"));
});

/* ================= 수동 시나리오용 준비물 =================
   tests/SCENARIOS.md 가 그대로 쓰는 주제다. 여섯 항목이 각각 다른 출처를 대표한다.
   시나리오를 돌리는 동안 파일이 생길 수 있으므로 '어떻게 해결되는가'가 아니라
   'info.md 가 무엇을 선언하고 있는가'를 주로 확인한다 — 그쪽이 흔들리지 않는다. */
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

  // 5번은 화면용 썸네일과 포스터용 원본을 따로 갖는 항목이다 (시나리오 D5·D6)
  const five = "5 주소 CORS 미허용.jpg";
  ok("5번 화면 썸네일은 축소본", /__itemrep/.test(src(five) || ""));
  ok("5번 포스터 원본은 원본", /__original/.test(podiumOf(ex.info.items[five]) || ""));
  ok("둘은 서로 다른 주소다", src(five) !== podiumOf(ex.info.items[five]));
  ok("6번은 원본을 따로 적지 않아도 된다", podiumOf(ex.info.items["6 주소 CORS 허용.png"]) === src("6 주소 CORS 허용.png"));

  /* 저장이 없을 때의 표시 순서는 파일명 순이다(loadTopic).
     Poster(Insta)는 상위 3개만 쓰므로 그 셋은 모두 그림이 있어야 한다.
     번호 접두어가 그 순서를 만든다 — 이름을 바꾸면 조용히 깨지므로 여기서 붙잡는다. */
  const byName = items.slice().sort();
  it("파일명 순 상위 3개가 전용 그림 셋이다", byName.slice(0, 3), own);
  ok("4위 이하에 주소가 적힌 항목이 있다", byName.slice(3).some(n => src(n)));
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

/* ================= 클립보드 붙여넣기 =================
   확장자에 맞춰 다시 인코딩하는지, 항목명 그대로 저장하는지를 본다.
   캔버스는 스텁이므로 '어떤 형식으로 toBlob 을 불렀는가'로 판정한다. */
await describe("붙여넣기", async () => {
  app(`
    flash = () => {}; render = () => {};
    calls = { toBlob: [], written: [], bitmaps: 0 };
    createImageBitmap = async () => ({ width: 4, height: 4, close() { calls.bitmaps++; } });
    origCreate = document.createElement;          // 블록 끝에서 되돌린다 — 뒤 블록으로 새면 안 된다
    document.createElement = tag => {
      const e = { tagName: (tag || "").toUpperCase(), style: {}, append() {}, className: "", textContent: "" };
      if (e.tagName === "CANVAS") {
        e.getContext = () => ({ fillStyle: "", fillRect() {}, drawImage() {} });
        e.toBlob = (cb, type) => { calls.toBlob.push(type); cb({ size: 9, type }); };
      }
      return e;
    };
    // 공용 폴더와 파일 쓰기를 가짜로 갈아 끼운다
    imagesFolder = async () => ({ mark: "dir" });
    writeFile = async (dir, name, data) => { calls.written.push({ name, type: data.type }); return { mark: name }; };
    sharedImages = new Map();
    useLocalImage = () => {};
    setClip = b => { navigator.clipboard = { read: async () => [{ types: [b.type], getType: async () => b }] }; };
    item = f => ({ file: f, label: f, url: "https://x/y.png" });
  `);

  const png = 'setClip({ size: 9, type: "image/png" })';
  const reset = () => app("calls.toBlob = []; calls.written = []; sharedImages = new Map();");

  ok("클립보드 지원을 감지한다", (app(`(${png}, canPaste())`)));

  // .png 항목 — 형식이 이미 맞으므로 변환하지 않는다
  reset();
  ok("png 항목 붙여넣기 성공", await app(`pasteInto(item("사진.png"))`));
  it("png 는 재인코딩하지 않는다", app("calls.toBlob"), []);
  it("항목명 그대로 저장한다", app("calls.written"), [{ name: "사진.png", type: "image/png" }]);
  it("공용 표에도 올린다", app(`[...sharedImages.keys()]`), ["사진.png"]);

  // .jpg 항목 — PNG 를 JPEG 로 바꿔 저장한다
  reset();
  ok("jpg 항목 붙여넣기 성공", await app(`pasteInto(item("그림.jpg"))`));
  it("jpg 로 재인코딩한다", app("calls.toBlob"), ["image/jpeg"]);
  it("저장된 형식도 jpeg", app("calls.written"), [{ name: "그림.jpg", type: "image/jpeg" }]);

  // 확장자를 모르면 손대지 않는다
  reset();
  await app(`pasteInto(item("무슨파일.bmp"))`);
  it("모르는 확장자는 그대로 둔다", app("calls.toBlob"), []);

  // 클립보드에 이미지가 없으면 아무것도 쓰지 않는다
  reset();
  app(`navigator.clipboard = { read: async () => [{ types: ["text/plain"], getType: async () => null }] };`);
  it("이미지가 없으면 실패", await app(`pasteInto(item("그림.jpg"))`), false);
  it("아무것도 저장하지 않는다", app("calls.written"), []);

  // 클립보드 읽기가 막히면 조용히 실패한다
  reset();
  app(`navigator.clipboard = { read: async () => { throw new Error("denied"); } };`);
  it("권한이 없으면 실패", await app(`pasteInto(item("그림.jpg"))`), false);
  it("이때도 저장하지 않는다", app("calls.written"), []);

  app("delete navigator.clipboard;");
  it("클립보드가 없으면 지원 안 함으로 본다", app("canPaste()"), false);
  app("document.createElement = origCreate;");
});

/* ================= 새 주제 만들기 =================
   폴더를 들여올 때 쓰는 info.md 뼈대. 이름만 채우고 설명은 사람이 붙인다. */
describe("info.md 뼈대", () => {
  const infoSkeleton = app("infoSkeleton");
  const out = infoSkeleton("내 주제", ["가.png", "나.jpg"]);

  it("주제 이름을 주석으로 적는다", out.split(NL)[0], "// 내 주제");
  ok("global 절이 있다", /^# global$/m.test(out));
  it("항목이 순서대로 들어간다", out.match(/^# .+$/gm), ["# global", "# 가.png", "# 나.jpg"]);
  ok("항목마다 빈 줄로 떨어져 있다", out.includes("# 가.png" + NL + NL + "# 나.jpg"));
  it("항목이 없으면 뼈대만", infoSkeleton("빈 주제", []).match(/^# .+$/gm), ["# global"]);

  // 만든 결과를 그대로 다시 읽을 수 있어야 한다
  const back = parseInfo(out);
  it("스스로 파싱된다", Object.keys(back.items), ["가.png", "나.jpg"]);
  it("주제 이름도 읽힌다", back.name, "내 주제");
});

/* ================= 쓰이지 않는 그림 =================
   공용 폴더의 그림 중 어느 info.md 도 부르지 않는 것. 지우는 판단의 근거이므로
   '멀쩡한 그림을 미사용으로 잘못 세는 일'이 없어야 한다. */
describe("미사용 그림 판정", () => {
  const unused = app("unusedImageNames");
  const info = n => `# global${NL}- x${NL}${NL}# ${n}${NL}- y${NL}`;

  it("아무도 안 부르면 전부 미사용", unused(["가.png", "나.jpg"], []), ["가.png", "나.jpg"]);
  it("부르는 주제가 있으면 빠진다", unused(["가.png", "나.jpg"], [info("가.png")]), ["나.jpg"]);
  it("여러 주제의 합집합을 본다",
    unused(["가.png", "나.jpg", "다.png"], [info("가.png"), info("다.png")]), ["나.jpg"]);
  it("주소로만 쓰는 항목도 이름을 부른 것이다",
    unused(["가.png"], [`# 가.png${NL}+ thumbnail-url: https://a.com/x.jpg${NL}`]), []);
  it("podium 은 세지 않는다", unused(["podium.png", "가.png"], []), ["가.png"]);
  it("파일이 없으면 빈 목록", unused([], [info("가.png")]), []);
  it("이름이 정확히 같아야 한다 — 확장자가 다르면 다른 파일",
    unused(["가.png"], [info("가.jpg")]), ["가.png"]);
});

/* ================= 화면 전환 =================
   순위표에 딸린 컨트롤은 순위표를 볼 때만 켜져야 한다. New Topic 화면에서
   월드컵이 눌리던 문제가 하나를 빠뜨린 데서 나왔으므로, 묶음 전체를 확인한다. */
describe("화면별 컨트롤", () => {
  const IDS = ["#searchWrap", "#viewControls", "#boardTools", "#btnCup"];
  app(`
    boxes = {};
    origQ2 = document.querySelector;
    document.querySelector = sel => (boxes[sel] ||= {
      hidden: null, id: sel, textContent: "", title: "", disabled: false, value: "",
      classList: { add() {}, remove() {}, toggle() {} },
    });
  `);
  const state = () => app("JSON.stringify(" + JSON.stringify(IDS) + ".map(i => boxes[i] && boxes[i].hidden))");

  app("boardChrome(false)");
  it("끄면 넷 다 숨는다", JSON.parse(state()), [true, true, true, true]);
  app("boardChrome(true)");
  it("켜면 넷 다 보인다", JSON.parse(state()), [false, false, false, false]);

  /* 화면은 셋 중 하나만 보인다.
     cupSetScreen 은 가짜로 바꾸지 않는다 — 그 함수가 #board 를 다시 켜기 때문에,
     showScreen 안에서의 호출 순서가 틀리면 순위표가 되살아난다. 그걸 잡아야 한다. */
  app("showUnused = () => {}; render = () => {}; cur = null; cup = null;");
  const shown = () => JSON.parse(app('JSON.stringify(["#board","#newTopic","#cleanup"].map(i => boxes[i] && boxes[i].hidden))'));

  app('showScreen("#board")');
  it("순위표만 보인다", shown(), [false, true, true]);
  it("순위표에서는 컨트롤이 켜진다", JSON.parse(state()), [false, false, false, false]);

  app('showScreen("#newTopic")');
  it("New Topic 만 보인다", shown(), [true, false, true]);
  it("New Topic 에서는 컨트롤이 꺼진다", JSON.parse(state()), [true, true, true, true]);

  app("showCleanup()");
  it("정리 화면만 보인다", shown(), [true, true, false]);
  it("정리 화면에서도 컨트롤이 꺼진다", JSON.parse(state()), [true, true, true, true]);

  app("document.querySelector = origQ2;");
});

/* ================= 그림 지연 로딩 =================
   loading 은 src 보다 먼저 정해야 한다. src 를 먼저 넣으면 그 자리에서 로딩이 시작돼
   지연 로딩이 걸리지 않는다 — 300종짜리 주제에서 원본 수백 MB 를 한꺼번에 받게 된다.
   속성이 '설정되었는가' 가 아니라 '어떤 순서로' 설정됐는지를 봐야 잡히는 종류다. */
describe("그림 지연 로딩", () => {
  // 대입 순서를 기록하는 가짜 img
  app(`
    origCreate = document.createElement;
    imgLogs = [];
    document.createElement = tag => {
      const base = origCreate(tag);
      if (tag !== "img") return base;
      const log = [];
      imgLogs.push(log);
      return new Proxy(base, { set(t, k, v) { log.push(k); t[k] = v; return true; } });
    };
  `);
  const orderOf = () => JSON.parse(app("JSON.stringify(imgLogs.map(l => l.filter(k => k === 'loading' || k === 'src')))"));

  app(`
    render = () => {}; scheduleSave = () => {}; flash = () => {};
    cur = {
      name: "t", dirHandle: null,
      info: { global: [], items: {} },
      save: { tierSizes: [1], tierNames: {}, checks: {} },
      items: [{ file: "a.png", label: "a", url: "https://x/a.png", ord: 0 }],
      view: { mode: "list", columns: 3, tierSize: 72 },
    };
    normalize();
  `);

  app("imgLogs = []; renderItem(cur.items[0]);");
  const list = orderOf().filter(l => l.length);
  ok("List·Gallery — img 를 만든다", list.length > 0);
  it("List·Gallery — loading 을 src 보다 먼저 정한다", list[0], ["loading", "src"]);

  app(`imgLogs = []; cur.view.mode = "tier"; renderTierView(origCreate("div"));`);
  const tier = orderOf().filter(l => l.length);
  ok("Tier — img 를 만든다", tier.length > 0);
  it("Tier — loading 을 src 보다 먼저 정한다", tier[0], ["loading", "src"]);

  app("document.createElement = origCreate; cur = null;");
});

/* ---------- 배치 테스트 공용 ----------
   a~d 네 아이템, 티어 [2,2] 짜리 가짜 주제. 화면을 그리는 부분만 비워 둔다.
   되돌리기·다시하기·티어 비우기 세 블록이 같이 쓴다. */
const order = () => app("sorted().map(i => i.file)");
const sizes = () => app("[...cur.save.tierSizes]");
const depth = () => app("undoStack.length");
const ahead = () => app("redoStack.length");
const item = f => `cur.items.find(i => i.file === ${JSON.stringify(f)})`;
const boardSetup = () => app(`
  render = () => {}; scheduleSave = () => {}; flash = () => {};
  cur = {
    name: "t", dirHandle: null,
    info: { global: [], items: {} },
    save: { tierSizes: [2, 2], tierNames: {}, checks: {} },
    items: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"].map((f, i) => ({ file: f, label: f, url: "blob:x", ord: i })),
    view: { mode: "tier", columns: 3, tierSize: 72 },
  };
  undoStack = []; redoStack = [];
  normalize();
`);

/* ================= 되돌리기 =================
   가짜 주제로 실제 배치 함수를 돌린다. */
describe("되돌리기", () => {

  boardSetup();
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
  boardSetup();
  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  app(`moveToTier(${item("c.jpg")}, 0, 0)`);
  it("두 번 옮긴 결과", order(), ["c.jpg", "d.jpg", "a.jpg", "b.jpg"]);
  it("두 단계", depth(), 2);
  app("undo()");
  it("한 단계 되돌림", order(), ["d.jpg", "a.jpg", "b.jpg", "c.jpg"]);
  app("undo()");
  it("두 단계 되돌림", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);

  // 끝에서의 이동은 단계를 쌓지 않는다
  boardSetup();
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
  boardSetup();
  app(`cur.save.checks["a.jpg"] = { "해봤음#0": false };`);
  app(`mutate(() => { cur.save.checks["a.jpg"]["해봤음#0"] = true; })`);
  it("체크가 켜졌다", app(`cur.save.checks["a.jpg"]["해봤음#0"]`), true);
  it("체크도 한 단계다", depth(), 1);
  app("undo()");
  it("체크도 되돌아온다", app(`cur.save.checks["a.jpg"]["해봤음#0"]`), false);

  // 티어 이름
  boardSetup();
  app(`mutate(() => { cur.save.tierNames["0"] = "최고"; })`);
  app("undo()");
  it("티어 이름도 되돌아온다", app(`cur.save.tierNames["0"]`), undefined);

  // 아무것도 바꾸지 않은 동작은 단계를 쌓지 않는다 — mutate() 가 스스로 판단한다
  boardSetup();
  app(`mutate(() => { cur.save.tierNames["0"] = "A"; })`);
  it("이름을 바꾸면 한 단계", depth(), 1);
  app(`mutate(() => { cur.save.tierNames["0"] = "A"; })`);
  it("같은 값으로 다시 써도 그대로", depth(), 1);
  app(`mutate(() => {})`);
  it("빈 동작도 그대로", depth(), 1);

  // 쌓이는 단계 수 상한
  boardSetup();
  app(`for (let i = 0; i < ${app("UNDO_MAX")} + 20; i++) mutate(() => cur.save.tierNames["x"] = String(i));`);
  it("상한을 넘지 않는다", depth(), app("UNDO_MAX"));

  // 주제를 바꾸면 되돌리기도 비워진다 (loadTopic 이 하는 일)
  app("undoStack = []; syncUndo();");
  it("주제 전환 후 비어 있다", depth(), 0);
});

/* ================= 다시하기 (Redo) =================
   undo 와 같은 스냅샷을 반대로 오간다. 관건은 스택 규율 —
   undo 가 redo 를 쌓고, redo 가 undo 를 쌓고, 새 변경이 redo 를 지우는 것. */
describe("다시하기", () => {

  boardSetup();
  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  it("변경 직후엔 다시할 것이 없다", ahead(), 0);
  app("undo()");
  it("undo 가 다시하기 한 단계를 쌓는다", ahead(), 1);
  app("redo()");
  it("redo 로 변경한 상태가 돌아온다", order(), ["d.jpg", "a.jpg", "b.jpg", "c.jpg"]);
  it("티어 크기도 함께 돌아온다", sizes(), [3, 1]);
  it("redo 가 되돌리기 한 단계를 도로 쌓는다", depth(), 1);
  it("다시할 것은 사라졌다", ahead(), 0);
  app("undo()");
  it("undo·redo 왕복이 안정적이다", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);

  // 새 변경은 갈림길을 지운다 — 지워진 미래로는 못 돌아간다
  boardSetup();
  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  app("undo()");
  it("다시하기 대기 중", ahead(), 1);
  app(`moveToTier(${item("c.jpg")}, 0, 0)`);
  it("새 변경이 다시하기를 지운다", ahead(), 0);
  app("redo()");
  it("빈 다시하기는 아무것도 안 한다", order(), ["c.jpg", "a.jpg", "b.jpg", "d.jpg"]);

  // 여러 단계도 순서대로 오간다
  boardSetup();
  app(`moveToTier(${item("d.jpg")}, 0, 0)`);
  app(`moveToTier(${item("c.jpg")}, 0, 0)`);
  app("undo(); undo();");
  it("두 단계가 다시하기로 쌓였다", ahead(), 2);
  app("redo()");
  it("한 단계 다시하기", order(), ["d.jpg", "a.jpg", "b.jpg", "c.jpg"]);
  app("redo()");
  it("두 단계 다시하기", order(), ["c.jpg", "d.jpg", "a.jpg", "b.jpg"]);
  it("전부 되돌리기 쪽으로 넘어갔다", [depth(), ahead()], [2, 0]);

  // 주제를 바꾸면 다시하기도 비워진다 (loadTopic 이 하는 일)
  app("undoStack = []; redoStack = []; syncUndo();");
  it("주제 전환 후 비어 있다", ahead(), 0);
});

/* ================= 티어 비우기 =================
   티어 삭제(×)와 같은 이동 규칙 — 아이템은 풀 맨 뒤로. 다른 점은 티어가 남는 것. */
describe("티어 비우기", () => {

  boardSetup();
  app("clearTier(0)");   // 티어 번호만 받는다 — 구간은 tierSizes() 에서 스스로 구한다
  it("비운 아이템은 풀 맨 뒤로 간다", order(), ["c.jpg", "d.jpg", "a.jpg", "b.jpg"]);
  it("티어는 빈 채로 남는다", sizes(), [0, 2]);
  it("다른 티어는 흔들리지 않는다 — c·d 가 그대로 2티어", order().slice(0, 2), ["c.jpg", "d.jpg"]);
  it("한 단계로 쌓인다", depth(), 1);
  app("undo()");
  it("되돌리면 순서가 돌아온다", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("티어 크기도 돌아온다", sizes(), [2, 2]);
  app("redo()");
  it("다시하기도 된다", sizes(), [0, 2]);

  // 마지막 티어를 비우면 아이템 순서는 그대로, 소속만 풀로 바뀐다
  boardSetup();
  app("clearTier(1)");
  it("순서는 그대로", order(), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  it("크기만 0 — c·d 는 이제 풀이다", sizes(), [2, 0]);
});

/* ================= 월드컵 되돌리기·다시하기 =================
   화면만 비우고 실제 엔진(cupStart·cupToggle)을 돌린다.
   선택 확정 뒤 620ms 의 강조 연출은 타이머를 가로채 손으로 돌린다 — 기다리지 않는다. */
describe("월드컵 되돌리기·다시하기", () => {
  boardSetup();   // 같은 가짜 주제 위에 월드컵에 필요한 것만 얹는다
  app(`
    cupRender = () => {};
    __timers = []; __rt = setTimeout; setTimeout = f => __timers.push(f);
    cupStart(4, 2, 1);
  `);
  const state = () => app("[cup.qi, cup.winners.length, cup.picked.length]");

  it("시작 — 1라운드 매치 2개", app("cup.queue.length"), 2);
  it("시작 — 스냅샷·다시하기 비어 있다", app("[cup.hist.length, cup.redo.length]"), [0, 0]);

  app("cupToggle(cup.queue[0].c[0])");
  it("선택하면 스냅샷이 쌓인다", app("cup.hist.length"), 1);
  it("확정 연출 동안 잠긴다", app("cupLock"), true);
  app("__timers.splice(0).forEach(f => f())");   // 연출 종료
  it("연출이 끝나면 다음 매치다", state(), [1, 1, 0]);

  app("cupUndo()");
  it("선택 전으로 돌아온다", state(), [0, 0, 0]);
  it("다시하기가 쌓였다", app("cup.redo.length"), 1);   // 스냅샷에 redo 가 섞이면 여기서 무너진다
  app("cupRedo()");
  it("다시하기 — 넘어간 상태로 복귀", state(), [1, 1, 0]);
  it("스냅샷이 도로 쌓였다", app("cup.hist.length"), 1);

  app("cupUndo()");
  app("cupToggle(cup.queue[0].c[1])");
  it("새 선택이 다시하기를 지운다", app("cup.redo.length"), 0);
  app("__timers.splice(0).forEach(f => f())");
  it("다른 카드로 진행됐다", app("cup.winners[0] === cup.queue[0].c[1]"), true);
  it("남은 연출 타이머가 없다", app("__timers.length"), 0);

  app("setTimeout = __rt; cup = null; cupLock = false; cupLastRound = 0;");
});

/* ================= 효과음 =================
   소리 자체는 못 듣지만, '무엇을 언제 만들고 트는가'는 스텁으로 다 보인다. */
describe("효과음", () => {
  const SFX_IDS = app("Object.values(SFX).flat()");

  it("쓰는 소리는 다섯 개다", SFX_IDS.length, 5);
  it("로드하면서 전부 미리 받아 둔다 — 첫 재생 지연 방지",
    app("__sfxLog.map(a => a.src).sort()"),
    SFX_IDS.map(id => `https://assets.mixkit.co/active_storage/sfx/${id}/${id}-preview.mp3`).sort());
  ok("전부 preload 지정", app(`__sfxLog.every(a => a.preload === "auto")`));

  it("포디엄 팡파레는 3종 랜덤 풀", app("SFX.fanfare.length"), 3);
  it("선택 확정음은 Paper slide", app("SFX.pick"), [1530]);
  it("라운드 전환음은 Tile game reveal", app("SFX.round"), [960]);

  app("sfxOn = true; __sfxBefore = __sfxLog.length; sfxPlay('round'); sfxPlay('round');");
  it("재생은 만들어 둔 오디오를 재사용한다", app("__sfxLog.length - __sfxBefore"), 0);
  it("두 번 불렀으면 두 번 튼다", app("sfxBank[SFX.round[0]].plays"), 2);

  app("__fan = SFX.fanfare.map(id => sfxBank[id]); __fan0 = __fan.reduce((s, a) => s + a.plays, 0);"
    + "for (let i = 0; i < 20; i++) sfxPlay('fanfare');");
  it("팡파레 20번이 전부 3종 풀 안에서 나온다",
    app("__fan.reduce((s, a) => s + a.plays, 0) - __fan0"), 20);

  app("sfxOn = false; __pick0 = sfxBank[SFX.pick[0]].plays; sfxPlay('pick');");
  it("꺼 두면 틀지 않는다", app("sfxBank[SFX.pick[0]].plays - __pick0"), 0);
  app("sfxOn = true;");
});

/* ================= 저장 경로 판정 =================
   드래그로 연결한 폴더(권한 '물어보기')에 저장하려고 권한 팝업을 띄우지 않는다는 정책.
   writeGranted 가 false 면 저장은 조용히 브라우저(localStorage)로 간다. */
await describe("저장 경로 판정 (writeGranted)", async () => {
  it("핸들이 없으면 파일 저장 없음", await app("writeGranted(null)"), false);
  it("허용된 폴더만 파일로 쓴다", await app(`writeGranted({ queryPermission: async () => "granted" })`), true);
  it("'물어보기' 상태면 안 쓴다 — 권한 팝업 방지", await app(`writeGranted({ queryPermission: async () => "prompt" })`), false);
  it("권한 API 가 없으면 일단 써 본다", await app("writeGranted({})"), true);
  it("권한 API 가 터져도 써 본다", await app(`writeGranted({ queryPermission: () => { throw 0; } })`), true);
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

/* ================= 썸네일 / 포스터 원본 갈라 쓰기 ================= */
describe("podiumOf — 화면은 썸네일, 포스터는 원본", () => {
  const L = (...xs) => xs.map(text => ({ text, extra: false }));
  const both = L("thumbnail-url: https://a.com/small.jpg", "podium-url: https://a.com/big.jpg");
  it("둘 다 있으면 화면은 썸네일", thumbOf(both), "https://a.com/small.jpg");
  it("둘 다 있으면 포스터는 원본", podiumOf(both), "https://a.com/big.jpg");

  const order = L("podium-url: https://a.com/big.jpg", "thumbnail-url: https://a.com/small.jpg");
  it("적은 순서가 뒤바뀌어도 같다", [thumbOf(order), podiumOf(order)],
    ["https://a.com/small.jpg", "https://a.com/big.jpg"]);

  const onlyPodium = L("podium-url: https://a.com/big.jpg");
  it("원본만 있으면 화면에도 그것을 쓴다", thumbOf(onlyPodium), "https://a.com/big.jpg");
  it("원본만 있으면 포스터도 그것", podiumOf(onlyPodium), "https://a.com/big.jpg");

  const onlyThumb = L("thumbnail-url: https://a.com/small.jpg");
  it("썸네일만 있으면 포스터도 그것으로 갈음", podiumOf(onlyThumb), "https://a.com/small.jpg");

  it("라벨 없는 주소는 지금까지처럼 썸네일", thumbOf(L("https://a.com/x.jpg")), "https://a.com/x.jpg");
  it("라벨 없는 주소만 있으면 포스터도 그것", podiumOf(L("https://a.com/x.jpg")), "https://a.com/x.jpg");
  it("대소문자·등호 표기도 원본으로 본다",
    podiumOf(L("thumbnail-url: https://a.com/s.jpg", "Podium-URL= https://a.com/b.jpg")), "https://a.com/b.jpg");
  it("주소가 없으면 null", podiumOf(L("👥 인원: 1 ~ 4")), null);
  ok("원본 줄도 설명에서 감춘다", isMetaLine("podium-url: https://a.com/big.jpg"));
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
