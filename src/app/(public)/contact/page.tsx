import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  RichText,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { getFallbackContactNotes, getPublishedManagedPage } from "@/lib/cms";
import { publicImages } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact and chapter context page for the TNTT Surrey public site.",
};

export default async function ContactPage() {
  const contactPage = await getPublishedManagedPage("contact");
  const contactCards = getFallbackContactNotes();

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Contact"
        title={contactPage.titleEn}
        description={contactPage.summaryEn}
        image={publicImages.contactLead}
        actions={
          <>
            <Link className="button-primary" href="/announcements">
              Browse announcements
            </Link>
            <Link className="button-secondary" href="/auth/sign-in">
              Staff sign in
            </Link>
          </>
        }
      />

      <SurfaceCard>
        <SectionHeading
          eyebrow="Contact structure"
          title="The main contact copy is editor-managed."
          description="Leadership can update the public-facing contact guidance in the CMS while this route keeps the same public structure."
        />
        <RichText text={contactPage.bodyEn} />
      </SurfaceCard>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Why this matters"
            title="Families need a stable contact destination."
            description="A dedicated public contact block will reduce the need to hunt through old messages or guess which staff member to ask."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Later CMS fields can support inbox address, office-hours copy, map text, and optional FAQs without changing the route structure.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Public contact details belong here; private staff and student contact records do not.
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Inter-route flow"
            title="Contact should connect naturally to the rest of the public site."
            description="Parents often arrive here after checking dates or looking for a form, so the route includes obvious return paths."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm font-semibold text-[var(--forest)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="/schedule"
            >
              Review the schedule
            </Link>
            <Link
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm font-semibold text-[var(--forest)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="/forms-resources"
            >
              Open forms and resources
            </Link>
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard>
        <SectionHeading
          eyebrow="Fallback contact notes"
          title="Stable guidance remains visible until leadership finalizes everything."
          description="These notes keep the route honest even while the chapter iterates on the exact public inbox and follow-up flow."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {contactCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <h2 className="text-xl font-semibold text-[var(--forest)]">{card.title}</h2>
              <p className="mt-3 text-sm text-[var(--muted)]">{card.description}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
