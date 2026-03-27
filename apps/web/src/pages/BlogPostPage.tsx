import { Link, Navigate, useParams } from "react-router-dom";
import { getBlogPost } from "../data/blogPosts.js";

function BlogPostPage() {
  const params = useParams();
  const post = getBlogPost(params.slug ?? "");

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="page-container max-w-[860px]">
      {/* Hero */}
      <header className="mb-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-tertiary-fixed/30 text-tertiary text-xs font-bold font-headline uppercase tracking-widest mb-4">
          {post.tag}
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant font-label">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
          <span>{post.readTime}</span>
        </div>
        <p className="text-on-surface-variant text-lg mt-4 leading-relaxed border-l-2 border-primary pl-4">
          {post.excerpt}
        </p>
      </header>

      {/* Body */}
      <article className="glass-card rounded-lg p-8 md:p-10 space-y-8">
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-4">{section.heading}</h2>
            <div className="space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-on-surface-variant leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </article>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link to="/blog" className="btn-secondary">← Back to Blog</Link>
        <Link to="/marketplace" className="btn-primary">Visit Marketplace</Link>
      </div>
    </div>
  );
}

export default BlogPostPage;
