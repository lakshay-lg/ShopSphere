import { Link, Navigate, useParams } from "react-router-dom";
import { getBlogPost } from "../data/blogPosts.js";

function BlogPostPage() {
  const params = useParams();
  const post = getBlogPost(params.slug ?? "");

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <section className="content-page blog-post-page">
      <article className="card-surface blog-post-hero">
        <p className="section-kicker">{post.tag}</p>
        <h1>{post.title}</h1>
        <div className="blog-meta-row">
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
        <p>{post.excerpt}</p>
      </article>

      <article className="card-surface blog-post-body">
        {post.sections.map((section) => (
          <section className="blog-post-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>

      <div className="blog-post-actions">
        <Link className="button-secondary" to="/blog">
          Back to Blog
        </Link>
        <Link className="button-primary" to="/marketplace">
          Visit Marketplace
        </Link>
      </div>
    </section>
  );
}

export default BlogPostPage;
