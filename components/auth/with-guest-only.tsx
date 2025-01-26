import { redirect } from "next/navigation";
import { AuthService } from "@/services/auth";

/**
 * Higher-order component that ensures only unauthenticated users can access the wrapped component.
 * If a user is authenticated, they will be redirected to their appropriate dashboard.
 */
export function withGuestOnly<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return async function GuestOnlyComponent(props: P) {
    const { user } = await AuthService.getCurrentUser();

    // If user is authenticated, redirect based on their role
    if (user?.profile) {
      if (user.profile.role === 'admin') {
        redirect('/admin');
      } else if (user.profile.role === 'agent') {
        redirect('/dashboard');
      } else {
        redirect('/');
      }
    }

    // If user is not authenticated, render the wrapped component
    return <WrappedComponent {...props} />;
  };
} 