// Content lint for the journal: keeps every post answer-engine ready.
// Run: npm run test:blog
import assert from "node:assert/strict";
import { blogPosts, postWordCount, readingTime, slugify } from "./blog.ts";

assert.equal(slugify("Why doesn't the purchase price tell you?"), "why-doesnt-the-purchase-price-tell-you");
assert.equal(new Set(blogPosts.map((p) => p.slug)).size, blogPosts.length, "slugs must be unique");

for (const post of blogPosts) {
  const words = post.quickAnswer.split(/\s+/).length;
  assert.ok(words >= 35 && words <= 80, `${post.slug}: quickAnswer should be 35–80 words, got ${words}`);
  assert.ok(post.title.length <= 70, `${post.slug}: title over 70 chars hurts SERP display`);
  assert.ok(post.description.length >= 100 && post.description.length <= 160, `${post.slug}: description should be 100–160 chars`);
  assert.ok(post.faqs.length >= 3, `${post.slug}: needs at least 3 FAQs`);
  assert.ok(post.quickTake.length >= 3, `${post.slug}: needs at least 3 quick-take points`);
  assert.ok(post.keywords.length >= 3, `${post.slug}: needs keywords`);
  assert.ok(post.sections.every((s) => /\?$/.test(s.heading)), `${post.slug}: section headings should be questions`);
  assert.equal(new Set(post.sections.map((s) => slugify(s.heading))).size, post.sections.length, `${post.slug}: duplicate heading ids`);
  assert.ok(postWordCount(post) >= 600, `${post.slug}: thin content (${postWordCount(post)} words)`);
  assert.ok(readingTime(post) >= 1);
}

console.log(`blog content lint passed (${blogPosts.length} posts)`);
