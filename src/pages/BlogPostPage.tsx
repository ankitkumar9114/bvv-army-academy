import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { blogPosts } from '../data/blogs';
import { usePageTitle } from '../lib/usePageTitle';
import BlogArticle from '../sections/blog/BlogArticle';

/** /blogs/:slug: one article; unknown slugs go back to the listing. */
export default function BlogPostPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const post = blogPosts.find((p) => p.slug === slug);
  usePageTitle(post ? t(`blog.posts.${post.slug}.title`) : undefined);
  if (!post) return <Navigate to="/blogs" replace />;
  return <BlogArticle post={post} />;
}
