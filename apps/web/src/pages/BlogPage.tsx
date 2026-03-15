import { Link } from "react-router-dom";
import { blogPosts } from "../data/blogPosts.js";

function BlogPage() {
  return (
    <section className="content-page">
      <article className="page-intro card-surface">
        <p className="section-kicker">Blog</p>
        <h1>Engineering notes from the ShopSphere build.</h1>
        <p>
          A focused feed for architecture decisions, scaling lessons, and
          implementation tradeoffs from this project.
        </p>
      </article>

      <section className="blog-grid">
        {blogPosts.map((post) => (
          <article className="card-surface blog-card" key={post.slug}>
            <p className="blog-tag">{post.tag}</p>
            <h2>{post.title}</h2>
            <div className="blog-meta-row">
              <span>{post.date}</span>
              <span>{post.readTime}</span>
            </div>
            <p>{post.excerpt}</p>
            <Link
              className="button-secondary blog-read-link"
              to={`/blog/${post.slug}`}
            >
              Read Article
            </Link>
          </article>
        ))}
      </section>
    </section>
  );
}

export default BlogPage;
