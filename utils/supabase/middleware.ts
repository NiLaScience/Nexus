import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/auth/callback'];

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser();

    // Get the current path
    const path = request.nextUrl.pathname;

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // If the route is not public and user is not authenticated, redirect to sign-in
    if (!isPublicRoute && !user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (user && isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    console.error('Error in middleware:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
