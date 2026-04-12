import type { Metadata } from "next";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { announcementPreviews, publicImages } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Announcement archive scaffold for the TNTT Surrey public site, ready for future CMS content.",
};

export default function AnnouncementsPage() {
  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Announcements"
        title="A clean archive for chapter-wide updates and event notices."
        description="Families should be able to scan current updates quickly, then open the right document or follow-up path when the CMS starts publishing real records."
        image={publicImages.announcementsLead}
        aside={
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/72 p-5 text-sm text-[var(--muted)]">
            Announcement cards are already shaped for title, summary, audience, publish date, and future attachments.
          </div>
        }
      />

      <SurfaceCard>
        <SectionHeading
          eyebrow="Seed content"
          title="Archive cards are present even before the CMS is connected."
          description="The placeholders below are intentionally obvious scaffolds so the chapter can replace them with approved copy later instead of rewriting the UI."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {announcementPreviews.map((announcement) => (
            <article
              key={announcement.slug}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                <span>{announcement.publishDate}</span>
                <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[0.68rem] tracking-[0.12em] text-[var(--muted)]">
                  {announcement.status}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                {announcement.title.en}
              </h2>
              <p className="mt-2 text-sm font-medium text-[var(--accent-strong)]">
                Audience: {announcement.audience}
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {announcement.summary.en}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Vietnamese-ready field: {announcement.title.vi}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Publishing expectations"
            title="This page is aimed at the real announcement workflow."
            description="Later tickets can focus on editor auth and data persistence because the public presentation layer is already in place."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Featured updates should surface on the homepage while the full archive lives here.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Time-sensitive posts should be able to carry attached PDFs and clear audience labels.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Short reminder posts and larger event announcements can share the same card/list pattern without becoming visually noisy.
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Privacy boundary"
            title="Public announcements stop well short of roster data."
            description="The chapter can communicate clearly without turning this route into a directory or exposing private family information."
          />
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              No student lookup, class roster, or family record information appears on public announcement pages.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Attachments here should be intentionally public documents only, never private registration records or sensitive files.
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
