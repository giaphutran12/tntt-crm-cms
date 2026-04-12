import { describe, expect, it } from "vitest";
import { getCheckedFormValue } from "./form-data";

describe("getCheckedFormValue", () => {
  it("returns false when a checkbox key is absent", () => {
    const formData = new FormData();

    expect(getCheckedFormValue(formData, "isReturningStudent")).toBe(false);
  });

  it("accepts the standard browser checkbox value", () => {
    const formData = new FormData();
    formData.append("isFeatured", "on");

    expect(getCheckedFormValue(formData, "isFeatured")).toBe(true);
  });

  it("treats hidden false plus checked checkbox as true", () => {
    const formData = new FormData();
    formData.append("uniformScarfNeeded", "0");
    formData.append("uniformScarfNeeded", "true");

    expect(getCheckedFormValue(formData, "uniformScarfNeeded")).toBe(true);
  });

  it("treats hidden false without a checked checkbox as false", () => {
    const formData = new FormData();
    formData.append("baptismCompleted", "0");

    expect(getCheckedFormValue(formData, "baptismCompleted")).toBe(false);
  });
});
