import { describe, expect, it } from "vitest";
import { serializeRosterRecordsToCsv, type CrmRosterRecord } from "./crm";

const sampleRecord: CrmRosterRecord = {
  attentionReasons: [
    "Paper form is received but data entry is not finished.",
    "Certificate details are only partially recorded.",
  ],
  certificateStatus: "partial",
  classGroupId: "class-1",
  classGroupName: "Dự Bị Thêm Sức",
  cycleId: "cycle-1",
  cycleName: "2025-2026 Registration",
  cycleSchoolYearLabel: "2025-2026",
  divisionCode: "TN2",
  divisionId: "division-1",
  divisionLabel: "Thieu Nhi 2",
  familyId: "family-1",
  familyName: "Nguyen household",
  id: "registration-1",
  intakeEnteredAt: "2026-02-10T18:30:00.000Z",
  needsAttention: true,
  parentNotifiedStatus: "Needs follow-up call about missing signature.",
  primaryGuardianEmail: "andrew.nguyen@example.com",
  primaryGuardianName: "Andrew Nguyen",
  primaryGuardianPhone: "604-555-0201",
  registrationStatus: "paper_form_received",
  studentId: "student-1",
  studentName: "Mika (Michael Nguyen)",
  teamName: "St. Giuse",
  totalCharged: "80.00",
  totalPaid: "40.00",
};

describe("serializeRosterRecordsToCsv", () => {
  it("exports the roster columns used by spreadsheet fallback", () => {
    const csv = serializeRosterRecordsToCsv([sampleRecord]);

    expect(csv).toContain("School Year,Cycle,Division Code");
    expect(csv).toContain("2025-2026,2025-2026 Registration,TN2,Thieu Nhi 2");
    expect(csv).toContain("Nguyen household,Andrew Nguyen,604-555-0201,andrew.nguyen@example.com");
  });

  it("serializes multiple attention reasons into a single CSV field", () => {
    const csv = serializeRosterRecordsToCsv([sampleRecord]);

    expect(csv).toContain(
      "Paper form is received but data entry is not finished. | Certificate details are only partially recorded.",
    );
  });
});
