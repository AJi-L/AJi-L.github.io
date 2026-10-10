// 文章加载：Markdown 放在 src/posts/ 下（支持子目录）。
// 用 Vite 的 import.meta.glob，避免依赖特定 Astro 版本的 Content Collections。
const compiled = import.meta.glob("../posts/**/*.md", { eager: true });
const raw = import.meta.glob("../posts/**/*.md", { eager: true, query: "?raw", import: "default" });

function slugFromPath(p) {
  return p.replace("../posts/", "").replace(/\.md$/, "");
}

function stripMarkdown(md) {
  return String(md || "")
    .replace(/^---[\s\S]*?---/, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPosts() {
  const posts = Object.entries(compiled).map(([path, mod]) => {
    const fm = (mod && mod.frontmatter) || {};
    const slug = slugFromPath(path);
    const text = stripMarkdown(raw[path]);
    return {
      slug,
      url: `/posts/${slug}/`,
      title: fm.title || slug,
      date: fm.date || "",
      updated: fm.updated || "",
      tags: Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [],
      summary: fm.summary || fm.description || text.slice(0, 120),
      draft: !!fm.draft,
      visibility: fm.visibility || "private",
      text: text.slice(0, 4000),
      Content: mod.default,
    };
  });
  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return posts;
}

// 生产构建时隐藏 draft；开发预览时保留。
export function visiblePosts() {
  const all = getPosts();
  return import.meta.env.PROD ? all.filter((p) => !p.draft) : all;
}

export function collectTags(posts) {
  const map = new Map();
  for (const p of posts) {
    for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

// 稳定的标签 URL slug（保留中文，空格转 -）。
export function tagSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "");
}

