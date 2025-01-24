import { FormMessage, Message } from "@/components/form-message";
import { SmtpMessage } from "../smtp-message";
import { SignUpForm } from "./sign-up-form";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="w-full space-y-4">
        <FormMessage message={searchParams} />
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
