import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAnnouncementAction } from "./actions";
import { requireMinimumRole } from "@/lib/auth/session";
import { provisionStaffUser } from "@/lib/auth/staff-user-provisioning";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  requireMinimumRole: vi.fn(),
}));

vi.mock("@/lib/auth/staff-user-provisioning", () => ({
  provisionStaffUser: vi.fn(async () => {}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/env")>("@/lib/env");

  return {
    ...actual,
    getOptionalServerEnv: () => ({
      DATABASE_URL: "",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      STAFF_SIGNUP_SHARED_PASSWORD: "",
      SUPABASE_PRIVATE_REGISTRATION_BUCKET: "private-registration-files",
      SUPABASE_PUBLIC_MEDIA_BUCKET: "public-media",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    }),
    isCmsConfigured: () => true,
  };
});

const mockedRequireMinimumRole = vi.mocked(requireMinimumRole);
const mockedProvisionStaffUser = vi.mocked(provisionStaffUser);
const mockedCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function buildSupabaseAdminClient(options?: {
  announcementInsertError?: { message: string } | null;
}) {
  const mediaInsertSingle = vi.fn(async () => ({
    data: {
      id: "asset-1",
      public_url: "https://cdn.example.com/announcements/asset-1.pdf",
    },
    error: null,
  }));
  const mediaInsertSelect = vi.fn(() => ({
    single: mediaInsertSingle,
  }));
  const mediaInsert = vi.fn(() => ({
    select: mediaInsertSelect,
  }));
  const mediaDeleteEq = vi.fn(async () => ({
    error: null,
  }));
  const mediaDelete = vi.fn(() => ({
    eq: mediaDeleteEq,
  }));
  const announcementInsert = vi.fn(async () => ({
    error: options?.announcementInsertError ?? null,
  }));
  const from = vi.fn((table: string) => {
    switch (table) {
      case "cms_media_assets":
        return {
          delete: mediaDelete,
          insert: mediaInsert,
        };
      case "cms_announcements":
        return {
          insert: announcementInsert,
        };
      default:
        throw new Error(`Unexpected table: ${table}`);
    }
  });
  const upload = vi.fn(async () => ({
    error: null,
  }));
  const remove = vi.fn(async () => ({
    error: null,
  }));
  const getPublicUrl = vi.fn((path: string) => ({
    data: {
      publicUrl: `https://cdn.example.com/${path}`,
    },
  }));
  const storageFrom = vi.fn(() => ({
    getPublicUrl,
    remove,
    upload,
  }));

  return {
    announcementInsert,
    mediaDeleteEq,
    mediaInsert,
    mediaInsertSingle,
    remove,
    storageFrom,
    upload,
    client: {
      from,
      storage: {
        from: storageFrom,
      },
    },
  };
}

function buildAnnouncementFormData() {
  const formData = new FormData();

  formData.append("titleEn", "Retreat packet ready");
  formData.append("summaryEn", "Download the packet.");
  formData.append("bodyEn", "Packet body");
  formData.append("status", "published");
  formData.append(
    "attachmentFile",
    new File(["packet"], "retreat-packet.pdf", {
      type: "application/pdf",
    }),
  );

  return formData;
}

async function expectRedirect(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return error.url;
    }

    throw error;
  }

  throw new Error("Expected redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedProvisionStaffUser.mockResolvedValue(undefined);
  mockedRequireMinimumRole.mockResolvedValue({
    authorized: true,
    currentUser: {
      email: "editor@example.com",
      id: "user-1",
      name: "Editor User",
      role: "editor",
    },
    reason: "ok",
  } as never);
});

describe("saveAnnouncementAction", () => {
  it("persists a new announcement with an uploaded attachment through the hosted Supabase client", async () => {
    const supabase = buildSupabaseAdminClient();
    mockedCreateSupabaseAdminClient.mockReturnValue(supabase.client as never);

    const redirectUrl = await expectRedirect(() =>
      saveAnnouncementAction(buildAnnouncementFormData()),
    );

    expect(supabase.upload).toHaveBeenCalledTimes(1);
    expect(mockedProvisionStaffUser).toHaveBeenCalledWith({
      email: "editor@example.com",
      fullName: "Editor User",
      role: "editor",
      userId: "user-1",
    });
    expect(supabase.announcementInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment_media_id: "asset-1",
        created_by: "user-1",
        slug: "retreat-packet-ready",
        status: "published",
        updated_by: "user-1",
      }),
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/announcements");
    expect(redirectUrl).toContain("/admin/announcements?notice=");
  });

  it("cleans up the uploaded asset when the announcement insert fails after upload", async () => {
    const supabase = buildSupabaseAdminClient({
      announcementInsertError: { message: "insert failed" },
    });
    mockedCreateSupabaseAdminClient.mockReturnValue(supabase.client as never);

    const redirectUrl = await expectRedirect(() =>
      saveAnnouncementAction(buildAnnouncementFormData()),
    );

    expect(supabase.upload).toHaveBeenCalledTimes(1);
    expect(supabase.mediaDeleteEq).toHaveBeenCalledWith("id", "asset-1");
    expect(supabase.remove).toHaveBeenCalledWith([
      expect.stringContaining("announcements/"),
    ]);
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
    expect(redirectUrl).toContain("/admin/announcements?error=insert%20failed");
  });
});
