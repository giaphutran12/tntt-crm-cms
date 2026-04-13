import { NextResponse } from "next/server";
import {
  getOptionalServerEnv,
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/env";

export function GET() {
  const env = getOptionalServerEnv();

  return NextResponse.json({
    status: "ok",
    app: "tntt-crm-cms",
    databaseConfigured: isDatabaseConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    storageBuckets: {
      public: env.SUPABASE_PUBLIC_MEDIA_BUCKET,
      private: env.SUPABASE_PRIVATE_REGISTRATION_BUCKET,
    },
  });
}
