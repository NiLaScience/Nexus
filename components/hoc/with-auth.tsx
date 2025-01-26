import { redirect } from 'next/navigation';
import { AuthService, type AuthUser } from '@/services/auth';

interface WithAuthProps {
  user: AuthUser;
}

type Role = 'admin' | 'agent' | 'customer';

interface AuthOptions {
  redirectTo?: string;
  allowedRoles?: Role[];
}

/**
 * Higher-order component that handles authentication and authorization
 * @param Component The component to wrap
 * @param options Authentication options
 */
export function withAuth<P extends WithAuthProps>(
  Component: React.ComponentType<P>,
  options: AuthOptions = {}
) {
  return async function AuthenticatedComponent(props: Omit<P, keyof WithAuthProps>) {
    const { user, error } = await AuthService.getCurrentUser();

    // Handle authentication
    if (!user || error) {
      return redirect(options.redirectTo || '/sign-in');
    }

    // Handle role-based access
    if (options.allowedRoles && user.profile) {
      const hasAllowedRole = options.allowedRoles.includes(user.profile.role as Role);
      if (!hasAllowedRole) {
        // Redirect based on role
        if (user.profile.role === 'customer') {
          return redirect('/tickets');
        }
        return redirect('/dashboard');
      }
    }

    // Pass the authenticated user to the wrapped component
    return <Component {...(props as P)} user={user} />;
  };
}

/**
 * HOC specifically for admin-only routes
 */
export function withAdminAuth<P extends WithAuthProps>(Component: React.ComponentType<P>) {
  return withAuth(Component, {
    allowedRoles: ['admin'],
    redirectTo: '/dashboard',
  });
}

/**
 * HOC specifically for agent routes (includes admins)
 */
export function withAgentAuth<P extends WithAuthProps>(Component: React.ComponentType<P>) {
  return withAuth(Component, {
    allowedRoles: ['admin', 'agent'],
    redirectTo: '/dashboard',
  });
}

/**
 * HOC specifically for customer routes
 */
export function withCustomerAuth<P extends WithAuthProps>(Component: React.ComponentType<P>) {
  return withAuth(Component, {
    allowedRoles: ['customer'],
    redirectTo: '/tickets',
  });
} 