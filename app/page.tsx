import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    redirect("/sign-in");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect based on role
  if (profile?.role === 'customer') {
    redirect("/tickets");
  }

  redirect("/dashboard");
}
