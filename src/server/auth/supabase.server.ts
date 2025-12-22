"use server"

import { createServerClient,  } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '~/env'

export async function createSupabaseClient(ignoreCookieExpiry = false) {
  const cookieStore = await cookies()

  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (ignoreCookieExpiry) {
              delete options.maxAge
            }

            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
