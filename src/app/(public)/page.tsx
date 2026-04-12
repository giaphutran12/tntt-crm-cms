import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import {
  announcementPreviews,
  chapterProfile,
  cmsReadyNotes,
  divisionOverview,
  familyNeeds,
  primaryActions,
  publicImages,
  upcomingDates,
} from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Public website scaffold for TNTT Surrey families to find announcements, dates, and chapter resources.",
};

export default function HomePage() {
  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Chapter website preview"
        title="A public front door for parents, families, and chapter updates."
        description={`${chapterProfile.shortName} now has a dedicated public shell for announcements, dates, and downloadable resources instead of relying only on scattered email chains.`}
        image={publicImages.homeHero}
        actions={
          <>
            {primaryActions.map((action, index) => (
              <Link
                key={action.href}
                className={index === 0 ? "button-primary" : "button-secondary"}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="eyebrow mb-2">Mobile first</p>
              <p className="text-sm text-[var(--muted)]">
                Built for parents checking updates on their phone before Mass or after chapter announcements.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="eyebrow mb-2">Bilingual ready</p>
              <p className="text-sm text-[var(--muted)]">
                English content ships first, while page and record structures remain ready for Vietnamese fields later.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
              <p className="eyebrow mb-2">Privacy boundary</p>
              <p className="text-sm text-[var(--muted)]">
                Public pages stay strictly separated from student, family, and registration data.
              </p>
            </div>
          </div>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="What families can do here"
            title="The public IA is organized around common parent questions."
            description="Each section is scaffolded to accept CMS data later without redesigning the front end."
          />
          <div className="grid gap-4">
            {familyNeeds.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/75 px-5 py-4 transition hover:border-[var(--accent)] hover:shadow-[0_14px_40px_rgba(33,41,52,0.08)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-[var(--forest)]">{item.title}</h3>
                  <span className="text-sm font-semibold text-[var(--accent)]">Open</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
              </Link>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Ready for CMS data"
            title="The shell already matches future content flows."
            description="This avoids a throwaway prototype and keeps later tickets focused on data wiring, auth, and editor workflows."
          />
          <div className="space-y-3">
            {cmsReadyNotes.map((note) => (
              <div
                key={note}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 px-4 py-4 text-sm text-[var(--muted)]"
              >
                {note}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Homepage modules"
            title="Latest announcements preview"
            description="Seeded cards show the structure the CMS will eventually populate with real publish dates, summaries, and attachments."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {announcementPreviews.map((announcement) => (
              <article
                key={announcement.slug}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <span>{announcement.publishDate}</span>
                  <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[0.68rem] tracking-[0.12em] text-[var(--muted)]">
                    {announcement.status}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                  {announcement.title.en}
                </h3>
                <p className="mt-2 text-sm font-medium text-[var(--accent-strong)]">
                  Audience: {announcement.audience}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {announcement.summary.en}
                </p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Upcoming dates"
            title="Simple schedule blocks before a full calendar exists."
            description="The first version focuses on clarity, not calendar complexity."
          />
          <div className="space-y-3">
            {upcomingDates.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {item.dateLabel}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--forest)]">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.note}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Chapter context"
            title="The public site stays rooted in real TNTT structure."
            description={`${chapterProfile.parish}. Division-based information can expand here without turning the site into a generic school or club template.`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {divisionOverview.map((division) => (
              <div
                key={division.name}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
              >
                <h3 className="text-lg font-semibold text-[var(--forest)]">
                  {division.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {division.description}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Editorial direction"
            title="Chapter-specific, not generic SaaS."
            description="Typography, color, and imagery draw from Catholic and chapter context while leaving space for real content to replace scaffolds."
          />
          <div className="grid gap-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Warm parchment tones, forest accents, and chapel imagery make the public shell feel more like a parish community than a dashboard product.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Announcement, schedule, and resource surfaces are intentionally calm and readable on mobile, where most parents will encounter them.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              {chapterProfile.bilingualNote}
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
