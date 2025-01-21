import { resetPasswordAction } from "@/app/actions/auth";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ResetPassword(props: {
  searchParams: Promise<Message> & { [key: string]: string };
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Get the current session to check if we have a valid recovery flow
  const { data: { session } } = await supabase.auth.getSession();

  // If there's no active recovery flow, redirect to forgot password
  if (!session?.user?.email) {
    redirect('/forgot-password');
  }

  return (
    <form className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your new password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your new password"
            minLength={6}
            required
          />
        </div>

        <SubmitButton 
          className="w-full"
          formAction={resetPasswordAction}
          pendingText="Resetting password..."
        >
          Reset password
        </SubmitButton>

        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
