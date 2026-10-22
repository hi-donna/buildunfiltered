import { site } from "@/site.config";

// Renders nothing until site.config.newsletterAction is set. A signup box that
// silently drops addresses is worse than not asking.
export default function Newsletter() {
  if (!site.newsletterAction) return null;
  return (
    <section className="news">
      <h2>Get the changes</h2>
      <p>
        The week in AI, once a week, from the same sources as this page.
        No digest of links you&apos;ve already seen.
      </p>
      <form action={site.newsletterAction} method="post">
        <input type="email" name="email" required placeholder="you@example.com" aria-label="Email address" />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
}
