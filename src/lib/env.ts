import { z } from "zod";
import { STORAGE_BUCKETS } from "./constants";

const optionalServerEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().or(z.literal("")),
  DATABASE_URL: z.string().min(1).optional().or(z.literal("")),
  STAFF_SIGNUP_SHARED_PASSWORD: z.string().min(1).optional().or(z.literal("")),
  SUPABASE_PUBLIC_MEDIA_BUCKET: z.string().min(1).default(STORAGE_BUCKETS.publicMedia),
  SUPABASE_PRIVATE_REGISTRATION_BUCKET: z
    .string()
    .min(1)
    .default(STORAGE_BUCKETS.privateRegistrationFiles),
});

type OptionalServerEnv = z.infer<typeof optionalServerEnvSchema>;

export function getOptionalServerEnv(): OptionalServerEnv {
  return optionalServerEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    STAFF_SIGNUP_SHARED_PASSWORD: process.env.STAFF_SIGNUP_SHARED_PASSWORD,
    SUPABASE_PUBLIC_MEDIA_BUCKET: process.env.SUPABASE_PUBLIC_MEDIA_BUCKET,
    SUPABASE_PRIVATE_REGISTRATION_BUCKET:
      process.env.SUPABASE_PRIVATE_REGISTRATION_BUCKET,
  });
}

export function isSupabaseConfigured() {
  const env = getOptionalServerEnv();

  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublishableKey(env));
}

export function isDatabaseConfigured() {
  return Boolean(getOptionalServerEnv().DATABASE_URL);
}

export function getRequiredDatabaseUrl() {
  const databaseUrl = getOptionalServerEnv().DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for server-side Postgres access.");
  }

  return databaseUrl;
}

export function getStaffSignupSharedPassword() {
  return getOptionalServerEnv().STAFF_SIGNUP_SHARED_PASSWORD || null;
}

export function getRequiredSupabaseUrl() {
  const supabaseUrl = getOptionalServerEnv().NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required to create a Supabase client.");
  }

  return supabaseUrl;
}

export function getRequiredSupabaseAnonKey() {
  return getRequiredSupabasePublishableKey();
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(getOptionalServerEnv().SUPABASE_SERVICE_ROLE_KEY);
}

export function getRequiredSupabasePublishableKey() {
  const publishableKey = getSupabasePublishableKey(getOptionalServerEnv());

  if (!publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required to create a Supabase client.",
    );
  }

  return publishableKey;
}

export function getRequiredSupabaseServiceRoleKey() {
  const serviceRoleKey = getOptionalServerEnv().SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin Supabase access.");
  }

  return serviceRoleKey;
}

function getSupabasePublishableKey(env: OptionalServerEnv) {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
