import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export const postModules = import.meta.glob("../content/posts/*.md");

const fallbackCategory = "未分类";

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function readGitDate(filePath, mode) {
  const relativePath = relative(process.cwd(), filePath).replace(/\\/g, "/");
  const args =
    mode === "first"
      ? ["log", "--diff-filter=A", "--follow", "--format=%cI", "--", relativePath]
      : ["log", "-1", "--format=%cI", "--", relativePath];

  try {
    const output = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

    return mode === "first" ? output.at(-1) : output[0];
  } catch {
    return "";
  }
}

async function readFileDate(slug, mode) {
  const filePath = join(process.cwd(), "src", "content", "posts", `${slug}.md`);
  const gitDate = readGitDate(filePath, mode);
  if (gitDate) return gitDate;

  const info = await stat(filePath);
  if (mode === "first" && Number.isFinite(info.birthtimeMs) && info.birthtimeMs > 0) {
    return info.birthtime;
  }
  return info.mtime;
}

function countPostWords(source) {
  const body = source
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/<[^>]+>/g, " ");
  const cjk = body.match(/[\u3400-\u9fff]/g) ?? [];
  const words = body
    .replace(/[\u3400-\u9fff]/g, " ")
    .match(/[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*/g) ?? [];

  return cjk.length + words.length;
}

async function readPostWordCount(slug) {
  try {
    const filePath = join(process.cwd(), "src", "content", "posts", `${slug}.md`);
    const source = await readFile(filePath, "utf8");
    return countPostWords(source);
  } catch {
    return 0;
  }
}

export async function getAllPosts() {
  const posts = await Promise.all(
    Object.entries(postModules).map(async ([path, loader]) => {
      const post = await loader();
      const slug = path.split("/").pop()?.replace(".md", "");
      const postSlug = slug ?? "";
      const publishedDate = formatDate(
        post.frontmatter.date ?? (await readFileDate(postSlug, "first")),
      );
      const updatedDate = formatDate(
        post.frontmatter.updated ?? (await readFileDate(postSlug, "last")),
      );
      const wordCount = await readPostWordCount(postSlug);

      return {
        slug: postSlug,
        post,
        title: post.frontmatter.title ?? "",
        description: post.frontmatter.description ?? "",
        date: publishedDate,
        updatedDate,
        category: post.frontmatter.category ?? fallbackCategory,
        tags: post.frontmatter.tags ?? [],
        wordCount,
        draft: post.frontmatter.draft,
      };
    }),
  );

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostTags(posts) {
  return Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function getPostCategories(posts) {
  return Array.from(new Set(posts.map((post) => post.category || fallbackCategory))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function getPostUpdates(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime(),
  );
}
