import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { getPublishedResources } from "@/lib/cms";
import { publicImages } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Forms & Resources",
  description:
    "Forms and resources scaffold for future public file uploads on the TNTT Surrey site.",
};

export default async function FormsResourcesPage() {
  const resources = await getPublishedResources();

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
          title="Public resources now come from the CMS."
          description="Each record can carry a file URL, summary, publish status, audience label, and optional bilingual metadata."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {resources.map((resource) => (
            <article
              key={resource.id}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow">{resource.availabilityLabel ?? "Available"}</p>
                {resource.audience ? (
                  <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {resource.audience}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--forest)]">
                {resource.titleEn}
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {resource.descriptionEn}
              </p>
              {resource.file ? (
                <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]" href={resource.file.publicUrl} target="_blank">
                  Download file
                </Link>
              ) : resource.linkUrl ? (
                <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]" href={resource.linkUrl} target="_blank">
                  Open link
                </Link>
              ) : null}
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
            title="Editors can now publish resources without code changes."
            description="The admin resources screen supports uploaded public files and external links, so this public route stays up to date through the CMS."
          />
          <div className="space-y-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Public resources should be intentionally published here; private registration submissions and internal records should not.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]">
              Seasonal packets, retreat forms, and evergreen handbooks can share the same list pattern without changing the page layout.
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
