import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secret = process.env.SUPABASE_SECRET_KEY || "";
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export function zuvoAdmin() {
  if (!url || !secret) {
    throw new Error("Zuvo is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function zuvoPublic() {
  if (!url || !publishable) {
    throw new Error("Zuvo is not configured.");
  }
  return createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
