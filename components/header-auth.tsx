import { signOutAction } from "@/app/actions/auth";
import { AuthService } from "@/services/auth";
import type { Profile } from "@/types/team";

export default async function AuthButton() {
  const { user } = await AuthService.getCurrentUser();

  if (!user || !user.profile) {
    return null;
  }

  return (
    <div className="flex items-center gap-4" key={user.profile.full_name}>
      Hey, {user.profile.full_name || user.email}!
      <form action={signOutAction}>
        <button className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
          Logout
        </button>
      </form>
    </div>
  );
}

// Add cache configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
