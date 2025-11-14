// File: app/auth/callback/route.js

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies(); // Get the cookie store instance

    // Create the server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        // Define the cookie methods correctly
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.delete(name, options);
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Success: Redirect to the dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Error: Redirect back to login
  console.error('Auth callback error: Code expired or invalid.');
  return NextResponse.redirect(`${origin}/login`);
}