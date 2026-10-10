import { visiblePosts } from "../lib/posts.js";
import { site } from "../site.config.js";

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

export function GET(context) {
  const siteUrl = (context.site && context.site.href ? context.site.href : site.url).replace(/\/$/, "");
  const posts = visiblePosts();
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${siteUrl}${p.url}</link>
      <guid>${siteUrl}${p.url}</guid>
      <pubDate>${p.date ? new Date(p.date).toUTCString() : ""}</pubDate>
      <description>${escapeXml(p.summary || "")}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${siteUrl}/</link>
    <description>${escapeXml(site.description)}</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
