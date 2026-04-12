import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { publicImages, resourcePreviews } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Forms & Resources",
  description:
    "Forms and resources scaffold for future public file uploads on the TNTT Surrey site.",
};

export default function FormsResourcesPage() {
  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="Forms & resources"
        title="A home for documents families need to find again later."
        description="This page is structured for downloadable public files and evergreen chapter resources, while staying honest that the actual uploads still need chapter approval."
        image={publicImages.resourcesLead}
        actions={
          <Link className="button-secondary" href="/contact">
            Contact the chapter
          </Link>
        }
      />

      <SurfaceCard>
        <SectionHeading
          eyebrow="Resource library"
          title="The content model is already shaped for file-backed records."
          description="Each card can later carry a file URL, summary, publish status, audience label, and optional bilingual metadata."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {resourcePreviews.map((resource) => (
            <article
              key={resource.title.en}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow">{resource.availability}</p>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {resource.audience}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                {resource.title.en}
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {resource.description.en}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Vietnamese-ready field: {resource.title.vi}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="What should live here"
            title="Public files should be intentionally published, not incidental."
            description="The chapter can grow this page gradually without mixing public documents with private registration artifacts."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Registration packets, retreat paperwork, and chapter handbooks are good fits when they are meant for public family access.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Seasonal files should be easy to publish and archive without changing the page layout or nav structure.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              Private student submissions, certificates, or internal documents should remain in separate protected storage.
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="Current state"
            title="The UI is ready even though files are not checked into the repo yet."
            description="This keeps the public information architecture moving without inventing fake downloadable assets."
          />
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              No public form files were found in the repo during the earlier asset audit, so this route intentionally stays upload-ready rather than pretending downloads exist.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Once the CMS lands, this page can be fed from a simple resource table with titles, summaries, files, audience labels, and publish state.
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
