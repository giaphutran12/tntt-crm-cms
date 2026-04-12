import type { Metadata } from "next";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { getPublishedAnnouncements } from "@/lib/cms";
import { publicImages } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Announcement archive scaffold for the TNTT Surrey public site, ready for future CMS content.",
};

function formatAnnouncementDate(value: string | null) {
  if (!value) {
    return "Draft scaffold";
  }

  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(value));
}

export default async function AnnouncementsPage() {
  const announcements = await getPublishedAnnouncements();

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Announcements"
        title="A clean archive for chapter-wide updates and event notices."
        description="Families should be able to scan current updates quickly, then open the right document or follow-up path without digging through old email threads."
        image={publicImages.announcementsLead}
        aside={
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/72 p-5 text-sm text-[var(--muted)]">
            Featured announcements can appear on the homepage while the full public archive lives here.
          </div>
        }
      />

      <SurfaceCard>
        <SectionHeading
          eyebrow="Published archive"
          title="Public announcements now come from the CMS."
          description="Editors can publish retreat notices, reminders, and chapter updates from the admin shell. Attachments remain intentionally public."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <article
              key={announcement.slug}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                <span>{formatAnnouncementDate(announcement.publishedAt)}</span>
                <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[0.68rem] tracking-[0.12em] text-[var(--muted)]">
                  {announcement.status}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                {announcement.titleEn}
              </h2>
              {announcement.audience ? (
                <p className="mt-2 text-sm font-medium text-[var(--accent-strong)]">
                  Audience: {announcement.audience}
                </p>
              ) : null}
              <p className="mt-3 text-sm text-[var(--muted)]">{announcement.summaryEn}</p>
              {announcement.attachment ? (
                <a
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]"
                  href={announcement.attachment.publicUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open attachment
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </SurfaceCard>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Publishing expectations"
            title="This page is aimed at the real announcement workflow."
            description="Announcements are intended for public chapter communication only. Family-sensitive or student-specific records remain inside the protected admin and CRM surfaces."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Use announcement cards for chapter-wide updates, event reminders, and family-facing deadlines.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Time-sensitive posts can carry attached PDFs and clear audience labels.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Short reminder posts and larger event announcements can share the same archive without becoming visually noisy.
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
