import type { Metadata } from "next";
import {
  PageHeader,
  RichText,
  SectionHeading,
  SurfaceCard,
} from "@/components/public-site";
import { getPublishedManagedPage } from "@/lib/cms";
import {
  aboutHighlights,
  chapterProfile,
  divisionOverview,
  publicImages,
} from "@/lib/public-site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About the TNTT Surrey chapter, its parish context, and how the public site will explain the chapter to families.",
};

export default async function AboutPage() {
  const aboutPage = await getPublishedManagedPage("about");

  return (
    <div className="space-y-10 pb-8">
      <PageHeader
        eyebrow="About the chapter"
        title={aboutPage.titleEn}
        description={aboutPage.summaryEn}
        image={publicImages.aboutLead}
        aside={
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/72 p-5">
            <p className="eyebrow mb-2">Local context</p>
            <p className="text-sm text-[var(--muted)]">
              {chapterProfile.parish} in {chapterProfile.location}.
            </p>
          </div>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading
            eyebrow="Mission framing"
            title="The main about copy is CMS-managed."
            description="Chapter leadership can revise the public framing for new families from the admin pages section."
          />
          <RichText text={aboutPage.bodyEn} />
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading
            eyebrow="What final copy should answer"
            title="Questions parents will expect this page to resolve."
            description="These prompts are here so a later CMS/static-page ticket can plug in approved chapter copy with minimal structural change."
          />
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              What TNTT / VEYM means in terms that make sense to families who do not already know the organization.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              How the local chapter relates to the Surrey parish community and what a normal year looks like.
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4">
              How the four divisions map to age and formation stages without exposing any student-specific information.
            </div>
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard>
        <SectionHeading
          eyebrow="Division overview"
          title="The chapter structure is already represented in the public shell."
          description="Division-specific copy can remain lightweight now and grow later without changing the route map or layout system."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {divisionOverview.map((division) => (
            <article
              key={division.name}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <p className="eyebrow mb-2">Division</p>
              <h3 className="text-xl font-semibold text-[var(--forest)]">
                {division.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {division.description}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading
          eyebrow="Supporting notes"
          title="The rest of the page still reflects the approved V1 boundaries."
          description="These cards remain useful as stable family-facing framing even while the main about copy becomes editable."
        />
        <div className="grid gap-4">
          {aboutHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 p-5"
            >
              <h3 className="text-lg font-semibold text-[var(--forest)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
