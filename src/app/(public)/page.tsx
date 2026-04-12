import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  RichText,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import {
  getPublishedAnnouncements,
  getPublishedManagedPage,
  getPublishedResources,
  getPublishedScheduleItems,
} from "@/lib/cms";
import {
  chapterProfile,
  divisionOverview,
  familyNeeds,
  primaryActions,
  publicImages,
} from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Public website scaffold for TNTT Surrey families to find announcements, dates, and chapter resources.",
};

function formatPublicDate(value: string | null) {
  if (!value) {
    return "Draft scaffold";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function HomePage() {
  const [managedHomePage, publishedAnnouncements, publishedScheduleItems, publishedResources] =
    await Promise.all([
      getPublishedManagedPage("home"),
      getPublishedAnnouncements(6),
      getPublishedScheduleItems(),
      getPublishedResources(),
    ]);

  const announcementPreviewCards =
    publishedAnnouncements.filter((announcement) => announcement.isFeatured).slice(0, 3).length > 0
      ? publishedAnnouncements.filter((announcement) => announcement.isFeatured).slice(0, 3)
      : publishedAnnouncements.slice(0, 3);
  const featuredDates =
    publishedScheduleItems.filter((item) => item.isFeatured).slice(0, 3).length > 0
      ? publishedScheduleItems.filter((item) => item.isFeatured).slice(0, 3)
      : publishedScheduleItems.slice(0, 3);
  const featuredResources =
    publishedResources.filter((resource) => resource.isFeatured).slice(0, 3).length > 0
      ? publishedResources.filter((resource) => resource.isFeatured).slice(0, 3)
      : publishedResources.slice(0, 3);

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Chapter website preview"
        title={managedHomePage.titleEn}
        description={managedHomePage.summaryEn}
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
            eyebrow="Homepage copy"
            title="The intro text is now CMS-managed."
            description="Editors can update the homepage framing in the admin without touching the route layout or code."
          />
          <RichText text={managedHomePage.bodyEn} />
        </SurfaceCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Homepage modules"
            title="Latest announcements preview"
            description="Featured records appear here first. If nothing is featured yet, the latest published announcements fill the preview."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {announcementPreviewCards.map((announcement) => (
              <article
                key={announcement.slug}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <span>{formatPublicDate(announcement.publishedAt)}</span>
                  <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[0.68rem] tracking-[0.12em] text-[var(--muted)]">
                    {announcement.status}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                  {announcement.titleEn}
                </h3>
                {announcement.audience ? (
                  <p className="mt-2 text-sm font-medium text-[var(--accent-strong)]">
                    Audience: {announcement.audience}
                  </p>
                ) : null}
                <p className="mt-3 text-sm text-[var(--muted)]">{announcement.summaryEn}</p>
                {announcement.attachment ? (
                  <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]" href={announcement.attachment.publicUrl} target="_blank">
                    Open attachment
                  </Link>
                ) : null}
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
            {featuredDates.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-4 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {item.dateLabelEn}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--forest)]">
                  {item.titleEn}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.noteEn}</p>
                {item.actionHref && item.actionLabel ? (
                  <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]" href={item.actionHref} target="_blank">
                    {item.actionLabel}
                  </Link>
                ) : null}
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
            eyebrow="Featured resources"
            title="Important downloads can surface on the homepage too."
            description="Feature the most important packet, handbook, or family resource here while the full library remains on the dedicated resources page."
          />
          <div className="grid gap-3">
            {featuredResources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]"
              >
                <p className="font-semibold text-[var(--forest)]">{resource.titleEn}</p>
                <p className="mt-2">{resource.descriptionEn}</p>
                {resource.file ? (
                  <Link className="mt-3 inline-flex font-semibold text-[var(--accent)]" href={resource.file.publicUrl} target="_blank">
                    Download file
                  </Link>
                ) : resource.linkUrl ? (
                  <Link className="mt-3 inline-flex font-semibold text-[var(--accent)]" href={resource.linkUrl} target="_blank">
                    Open link
                  </Link>
                ) : null}
              </div>
            ))}
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              {chapterProfile.bilingualNote}
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
