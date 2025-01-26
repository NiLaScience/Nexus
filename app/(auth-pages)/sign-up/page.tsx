import { FormMessage, Message } from "@/components/form-message";
import { SmtpMessage } from "../smtp-message";
import { SignUpForm } from "./sign-up-form";
import { withGuestOnly } from "@/components/auth/with-guest-only";

interface SignupProps {
  searchParams: Promise<Message>;
}

async function Signup({ searchParams }: SignupProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="w-full space-y-4">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <>
      <SignUpForm />
      <SmtpMessage />
    </>
  );
}

export default withGuestOnly(Signup);
