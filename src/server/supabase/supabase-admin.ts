import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminClient: SupabaseClient | null = null;

export const SupabaseService = {
  get client(): SupabaseClient {
    if (!supabaseAdminClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        throw new Error(
          "Supabase URL or Service Role Key not found in environment variables.",
        );
      }

      supabaseAdminClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return supabaseAdminClient;
  },
};
