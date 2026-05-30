export const postModules = import.meta.glob("../content/posts/*.md");

export async function getAllPosts() {
  const posts = await Promise.all(
    Object.entries(postModules).map(async ([path, loader]) => {
      const post = await loader();
      const slug = path.split("/").pop()?.replace(".md", "");
      return {
        slug,
        post,
        title: post.frontmatter.title ?? "",
        description: post.frontmatter.description ?? "",
        date: post.frontmatter.date ?? "",
        tags: post.frontmatter.tags ?? [],
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
