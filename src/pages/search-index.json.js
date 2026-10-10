import { visiblePosts } from "../lib/posts.js";

export function GET() {
  const items = visiblePosts().map(({ Content, ...rest }) => rest);
  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
