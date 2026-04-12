import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_SECTIONS } from "./admin/navigation";

const REPO_ROOT = process.cwd();

function readRepoFile(relativePath: string) {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("privacy boundaries", () => {
  it("keeps public routes and public chrome free of CRM and admin imports", () => {
    const publicFiles = [
      "src/app/(public)/layout.tsx",
      "src/app/(public)/page.tsx",
      "src/app/(public)/about/page.tsx",
      "src/app/(public)/announcements/page.tsx",
      "src/app/(public)/contact/page.tsx",
      "src/app/(public)/forms-resources/page.tsx",
      "src/app/(public)/schedule/page.tsx",
      "src/components/public-site.tsx",
    ];

    const forbiddenPatterns = [
      /from ["']@\/lib\/crm["']/,
      /from ["']@\/app\/admin\//,
      /from ["']@\/components\/admin\//,
      /from ["']@\/lib\/auth\/session["']/,
    ];

    for (const file of publicFiles) {
      const source = readRepoFile(file);

      for (const pattern of forbiddenPatterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  });

  it("keeps the CMS data layer free of CRM table access and private storage references", () => {
    const cmsSource = readRepoFile("src/lib/cms.ts");

    expect(cmsSource).not.toContain("crm_");
    expect(cmsSource).not.toContain("private-registration-files");
  });

  it("requires operations access for CRM sections and exports", () => {
    const crmSections = ADMIN_SECTIONS.filter((section) => section.group === "crm");
    const exportRouteSource = readRepoFile("src/app/admin/exports/download/route.ts");

    expect(crmSections.length).toBeGreaterThan(0);

    for (const section of crmSections) {
      expect(section.minimumRole).toBe("operations");
    }

    expect(exportRouteSource).toContain('requireMinimumRole("operations"');
  });
});
