import { redirect } from "next/navigation";
import { AuthService } from "@/services/auth";
import { withAuth } from "@/components/hoc/with-auth";
import type { AuthSession } from "@/services/auth";

function Home() {
  return AuthService.getCurrentUser().then((session: AuthSession) => {
    // Redirect based on role
    if (session.user?.profile?.role === 'customer') {
      redirect("/tickets");
    }

    redirect("/dashboard");
    return null; // Required for React component
  });
}

export default withAuth(Home);
