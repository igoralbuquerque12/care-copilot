import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseService {
  private static instance: SupabaseClient | null = null;

  private constructor() {
    // default for new instantiations
  }

  public static get client(): SupabaseClient {
    if (!this.instance) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        throw new Error("Supabase URL or Service Role Key not found in environment variables.");
      }

      this.instance = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.instance;
  }
}