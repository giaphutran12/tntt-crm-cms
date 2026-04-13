import { NextResponse, type NextRequest } from "next/server";
import {
  applyDefaultRosterCycle,
  listRegistrationCyclesForAdmin,
  listRosterRecordsForAdmin,
  parseCrmRosterFilters,
  serializeRosterRecordsToCsv,
} from "@/lib/crm";
import { requireMinimumRole } from "@/lib/auth/session";

function buildExportFilename(
  cycleLabel: string | null,
  exportedAt = new Date(),
) {
  const dateStamp = exportedAt.toISOString().slice(0, 10);
  const scopedCycle = cycleLabel
    ? cycleLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "all-cycles";

  return `tntt-roster-${scopedCycle}-${dateStamp}.csv`;
}

export async function GET(request: NextRequest) {
  const access = await requireMinimumRole("operations", request.nextUrl.pathname);

  if (!access.authorized) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const cycles = await listRegistrationCyclesForAdmin();
  const filters = applyDefaultRosterCycle(
    parseCrmRosterFilters({
      attention: request.nextUrl.searchParams.get("attention"),
      classGroupId: request.nextUrl.searchParams.get("classGroupId"),
      cycleId: request.nextUrl.searchParams.get("cycleId"),
      divisionId: request.nextUrl.searchParams.get("divisionId"),
      registrationStatus: request.nextUrl.searchParams.get("registrationStatus"),
      team: request.nextUrl.searchParams.get("team"),
    }),
    cycles,
  );
  const records = await listRosterRecordsForAdmin(filters);
  const cycleLabel =
    cycles.find((cycle) => cycle.id === filters.cycleId)?.schoolYearLabel ?? null;

  return new NextResponse(serializeRosterRecordsToCsv(records), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${buildExportFilename(cycleLabel)}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
