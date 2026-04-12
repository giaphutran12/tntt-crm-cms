import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const requestUrl = new URL(request.url);
  const nextUrl = new URL("/auth/sign-in?signedOut=1", requestUrl.origin);

  return NextResponse.redirect(nextUrl, { status: 303 });
}
