import type { Metadata } from "next";
import { BlogFooter, BlogHeader } from "@/app/blog/components";
import { PRIVACY_EMAIL } from "@/lib/privacy";
import DeleteForm from "./form";
import "@/app/blog/blog.css";

export const metadata: Metadata = {
  title: "Delete my account and data | BoatUneet",
  description: "Remove your BoatUneet valuation request, waitlist entry, Meta lead and consent records.",
  robots: { index: false, follow: true },
};

export default function DeleteAccountPage() {
  return (
    <div className="blog-page article-page">
      <BlogHeader />
      <main id="main-content">
        <article className="article-shell py-12 sm:py-16">
          <p className="blog-eyebrow">Your data</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Delete my account and data</h1>
          <div className="article-body mt-8">
            <p>
              Enter the email you used with BoatUneet. We will remove your valuation requests, waitlist entry, any
              Meta lead-form submissions and your consent records straight away. This cannot be undone.
            </p>
            <p>
              Need something else, such as a copy of your data or a correction? Email{" "}
              <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
            </p>
          </div>
          <DeleteForm />
        </article>
      </main>
      <BlogFooter />
    </div>
  );
}
