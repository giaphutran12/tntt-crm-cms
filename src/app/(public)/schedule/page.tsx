import type { Metadata } from "next";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { publicImages, upcomingDates, weeklyRhythm } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Schedule scaffold for weekly rhythms and important chapter dates on the TNTT Surrey public site.",
};

export default function SchedulePage() {
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
            eyebrow="Weekly rhythm"
            title="A readable weekly structure comes first."
            description="The public spec explicitly favors a manageable list view before investing in a more complex calendar UI."
          />
          <div className="space-y-3">
            {weeklyRhythm.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {item.dateLabel}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--forest)]">
                  {item.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.note}</p>
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

      <SurfaceCard>
        <SectionHeading
          eyebrow="Upcoming date slots"
          title="Special events can drop into the same visual system."
          description="These placeholders reserve space for chapter-confirmed milestones without pretending unapproved dates are already final."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {upcomingDates.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {item.dateLabel}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--forest)]">
                {item.label}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.note}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
