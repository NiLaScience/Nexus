import { signInAction } from "@/app/actions/auth";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withGuestOnly } from "@/components/auth/with-guest-only";
import Link from "next/link";

interface LoginProps {
  searchParams: Promise<Message>;
}

async function Login({ searchParams }: LoginProps) {
  const message = await searchParams;

  // Wrap the signInAction to match the expected type
  const handleSubmit = async (formData: FormData) => {
    await signInAction(formData);
  };

  return (
    <form className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link className="underline hover:text-primary" href="/sign-up">
            Sign up
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email" 
            type="email"
            placeholder="you@example.com" 
            required 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-sm text-muted-foreground hover:text-primary"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <SubmitButton 
          className="w-full"
          pendingText="Signing In..." 
          formAction={handleSubmit}
        >
          Sign in
        </SubmitButton>

        <FormMessage message={message} />
      </div>
    </form>
  );
}

export default withGuestOnly(Login);
