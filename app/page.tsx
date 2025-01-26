import { redirect } from "next/navigation";
import { AuthService } from "@/services/auth";
import { withAuth } from "@/components/hoc/with-auth";
import type { AuthResponse } from "@/services/auth";

function Home() {
  return AuthService.getCurrentUser().then((response: AuthResponse) => {
    if (response.user?.profile?.role === 'customer') {
      redirect('/tickets');
    } else {
      redirect('/dashboard');
    }
  });
}

export default withAuth(Home);
