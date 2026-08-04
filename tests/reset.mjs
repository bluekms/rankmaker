/* 수동 시나리오를 돌린 뒤 topics/ 를 원래대로 되돌린다.
 *
 *   node tests/reset.mjs         무엇을 되돌릴지 보여주기만 한다 (안전)
 *   node tests/reset.mjs --yes   실제로 되돌린다
 *
 * 되돌리는 것
 *   1) 시나리오 중 생긴 추적되지 않는 파일 — 내려받은 그림, save.json, cup.save.json
 *   2) 테스트하려고 고친 추적 파일 — info.md 등을 git 의 마지막 커밋 상태로
 *
 * 지우는 대상은 topics/images/ 안이거나 ex_* 예제 주제 안인 것만으로 좁혔다.
 * 개인 주제 폴더(추적되지 않는 내 데이터)를 실수로 날리지 않기 위해서다.
 * 브라우저 localStorage 에 남는 읽기 전용 저장분은 여기서 지울 수 없다 —
 * 필요하면 개발자도구 > Application > Local Storage 에서 rm:* 키를 지운다.
 */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--yes");

const git = (...args) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split("\0").map(s => s.trim()).filter(Boolean);

// 지워도 되는 자리인가 — 공용 그림 폴더이거나 ex_ 로 시작하는 예제 주제
const disposable = p => {
  const parts = p.split("/");
  if (parts[0] !== "topics" || parts.length < 2) return false;
  return parts[1] === "images" || parts[1].startsWith("ex_");
};

let untracked, modified;
try {
  untracked = git("ls-files", "-o", "--exclude-standard", "-z", "topics").filter(disposable);
  modified = git("ls-files", "-m", "-z", "topics").filter(disposable);
} catch (e) {
  console.error("git 을 실행하지 못했습니다:", e.message);
  process.exit(1);
}

const skipped = git("ls-files", "-o", "--exclude-standard", "-z", "topics").filter(p => !disposable(p));

if (!untracked.length && !modified.length) {
  console.log("되돌릴 것이 없습니다 — topics/ 가 이미 깨끗합니다.");
} else {
  if (untracked.length) {
    console.log(`\n지울 파일 ${untracked.length}개 (시나리오 중 생김)`);
    untracked.forEach(p => console.log("  - " + p));
  }
  if (modified.length) {
    console.log(`\n되돌릴 파일 ${modified.length}개 (git 의 마지막 커밋 상태로)`);
    modified.forEach(p => console.log("  ~ " + p));
  }
}
if (skipped.length) {
  console.log(`\n건드리지 않음 ${skipped.length}개 (예제가 아닌 폴더 — 내 데이터일 수 있다)`);
  skipped.forEach(p => console.log("  · " + p));
}

if (!apply) {
  if (untracked.length || modified.length) console.log("\n실제로 되돌리려면: node tests/reset.mjs --yes");
  process.exit(0);
}

for (const p of untracked) rmSync(join(ROOT, p), { force: true });
if (modified.length) git("checkout", "--", ...modified);
console.log(`\n완료 — ${untracked.length}개 삭제, ${modified.length}개 복원.`);
