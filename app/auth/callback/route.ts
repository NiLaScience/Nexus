import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const next = requestUrl.searchParams.get("next")?.toString();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // If there's an error, redirect to sign-in with error message
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }

    // If we have a next URL (like from password reset), use that
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // If we have a specific redirect_to path, use that
    if (redirectTo) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    // Default redirect to dashboard
    return NextResponse.redirect(`${origin}/`);
  }

  // No code present, redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in`);
}
