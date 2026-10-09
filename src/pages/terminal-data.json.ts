import { profile } from '../data/profile';
import { friendLinks } from '../data/friendLinks';
import { giscus } from '../data/giscus';
import { getAllPosts } from '../utils/posts';

export async function GET() {
  const posts = await getAllPosts();
  const articles = await Promise.all(posts.map(async ({ post, ...metadata }) => ({
    ...metadata,
    url: `/posts/${metadata.slug}/`,
    html: await post.compiledContent(),
  })));
  return new Response(JSON.stringify({ profile, friends: friendLinks, posts: articles, giscus }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
