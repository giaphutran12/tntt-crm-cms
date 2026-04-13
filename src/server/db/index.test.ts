import { describe, expect, it } from "vitest";
import { buildDbAccessClaims, getDatabaseSslConfig } from "./index";

describe("getDatabaseSslConfig", () => {
  it("keeps localhost database URLs on plain TCP", () => {
    expect(
      getDatabaseSslConfig("postgres://postgres:postgres@127.0.0.1:54322/postgres"),
    ).toBe(false);
    expect(
      getDatabaseSslConfig("postgres://postgres:postgres@localhost:54322/postgres"),
    ).toBe(false);
  });

  it("respects explicit sslmode=disable", () => {
    expect(
      getDatabaseSslConfig(
        "postgres://postgres:postgres@db.example.com:5432/postgres?sslmode=disable",
      ),
    ).toBe(false);
  });

  it("uses relaxed SSL for non-local database hosts", () => {
    expect(
      getDatabaseSslConfig("postgres://postgres:postgres@db.example.com:5432/postgres"),
    ).toEqual({ rejectUnauthorized: false });
  });
});

describe("buildDbAccessClaims", () => {
  it("builds authenticated claims with a user id", () => {
    expect(
      buildDbAccessClaims({
        userId: "user-123",
      }),
    ).toEqual({
      claims: JSON.stringify({
        role: "authenticated",
        sub: "user-123",
      }),
      role: "authenticated",
      userId: "user-123",
    });
  });

  it("supports anon sessions without a subject id", () => {
    expect(
      buildDbAccessClaims({
        role: "anon",
      }),
    ).toEqual({
      claims: JSON.stringify({
        role: "anon",
        sub: null,
      }),
      role: "anon",
      userId: "",
    });
  });
});
