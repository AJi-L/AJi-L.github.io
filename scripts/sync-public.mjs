// 从私有笔记目录里，把标记 visibility: public 的 Markdown 同步进 src/posts/。
//
// 用法：
//   node scripts/sync-public.mjs "D:\\我的笔记"
//   # 或设置环境变量 NOTES_DIR
//
// 规则：
//   - 只拷贝 frontmatter 含 `visibility: public` 的文章；其它一律跳过（默认私有）。
//   - `draft: true` 也跳过。
//   - 保留相对目录结构；目标已存在同名文件时覆盖（以笔记为准）。
//   - 不做删除：公开仓里多余的旧文章请手动清理。
//   - 会做一次“疑似密钥”检查，命中则跳过并报警。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const destRoot = path.join(projectRoot, "src", "posts");

const srcDir = process.argv[2] || process.env.NOTES_DIR;
if (!srcDir) {
  console.error("用法: node scripts/sync-public.mjs <笔记目录>   （或设置 NOTES_DIR）");
  process.exit(1);
}
if (!fs.existsSync(srcDir)) {
  console.error("笔记目录不存在: " + srcDir);
  process.exit(1);
}

const SECRET_RE = /(api[_-]?key|secret|password|passwd|token|BEGIN [A-Z ]*PRIVATE KEY)\s*[:=]\s*\S{8,}/i;

function frontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const raw = text.slice(3, end);
  const fm = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) fm[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return fm;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.toLowerCase().endsWith(".md")) out.push(p);
  }
  return out;
}

const copied = [];
const skipped = [];

for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, "utf8");
  const fm = frontmatter(text);
  const rel = path.relative(srcDir, file);
  if (String(fm.visibility).toLowerCase() !== "public") {
    skipped.push(rel);
    continue;
  }
  if (String(fm.draft).toLowerCase() === "true") {
    skipped.push(rel + "  (draft)");
    continue;
  }
  if (SECRET_RE.test(text)) {
    console.warn("⚠️  疑似密钥，跳过: " + rel);
    skipped.push(rel + "  (secret?)");
    continue;
  }
  const dest = path.join(destRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text, "utf8");
  copied.push(rel);
}

console.log(`\n源目录: ${srcDir}`);
console.log(`公开并同步: ${copied.length}`);
copied.forEach((f) => console.log("  + " + f));
console.log(`跳过(私有/draft/疑似密钥): ${skipped.length}`);
