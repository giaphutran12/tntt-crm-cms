import type { Metadata } from "next";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { getPublishedScheduleItems } from "@/lib/cms";
import { publicImages } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Schedule scaffold for weekly rhythms and important chapter dates on the TNTT Surrey public site.",
};

export default async function SchedulePage() {
  const scheduleItems = await getPublishedScheduleItems();

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Schedule"
        title="Important dates should be simple to scan on mobile."
        description="The initial direction uses clear list and timeline patterns that parents can trust, without forcing a full calendar product before the chapter needs one."
        image={publicImages.scheduleLead}
      />

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Published schedule"
            title="A readable weekly structure comes first."
            description="The public schedule stays intentionally simple: a list of parent-readable entries with optional action links."
          />
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {item.dateLabelEn}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                  {item.titleEn}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.noteEn}</p>
                {item.actionHref && item.actionLabel ? (
                  <a
                    className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]"
                    href={item.actionHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.actionLabel}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="How updates should work"
            title="Schedule entries are meant to stay tightly scoped."
            description="Later CMS editors should be able to add or edit dates without touching code or reformatting the page."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Use the schedule page for recurring patterns and known dates, then mirror urgent changes in announcements.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Keep each entry scannable: label, date/time text, audience, and optional action link.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Avoid calendar complexity until there is a real operational need for filters, month views, or event registration.
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
