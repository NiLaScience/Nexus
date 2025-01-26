import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
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
    const supabase = await SupabaseService.createAnonymousClientWithCookies();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // If there's an error, redirect to sign-in with error message
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }

    // Get the user's profile to determine where to redirect
    const { user, error: profileError } = await AuthService.getCurrentUser();
    
    if (profileError || !user?.profile) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent("Failed to get user profile")}`
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

    // For customers, check if they have an organization
    if (user.profile.role === 'customer') {
      if (!user.profile.organization_id) {
        // Redirect to settings with a message to join an organization
        return NextResponse.redirect(
          `${origin}/settings?message=${encodeURIComponent("Please join an organization to continue")}`
        );
      }
      return NextResponse.redirect(`${origin}/tickets`);
    }

    // Default redirect to dashboard for agents and admins
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // No code present, redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in`);
}
