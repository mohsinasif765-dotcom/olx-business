import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secret = process.env.SUPABASE_SECRET_KEY || "";
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

export function zuvoAdmin() {
  if (!url || !secret) {
    throw new Error("Zuvo is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  if (!adminClient) {
    adminClient = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export function zuvoPublic() {
  if (!url || !publishable) {
    throw new Error("Zuvo is not configured.");
  }
  if (!publicClient) {
    publicClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return publicClient;
}
