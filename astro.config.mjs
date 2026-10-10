// @ts-check
import { defineConfig } from "astro/config";

// 站点配置。用户站 https://<user>.github.io 时 base 省略；
// 若改成项目站（如仓库名 aji_blog），把 base 打开为 "/aji_blog"。
export default defineConfig({
  site: "https://aji-l.github.io",
  // base: "/aji_blog",
  markdown: {
    shikiConfig: { theme: "github-dark" },
  },
});
