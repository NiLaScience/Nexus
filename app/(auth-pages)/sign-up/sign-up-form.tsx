'use client';

import { signUpAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface Organization {
  id: string;
  name: string;
  domain: string;
}

export function SignUpForm({ organizations }: { organizations: Organization[] }) {
  const searchParams = useSearchParams();
  const [showOrgFields, setShowOrgFields] = useState(false);

  // Get message from search params if it exists
  const message = searchParams.get('message');
  const messageObj = message ? { message } : undefined;

  return (
    <form className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="underline hover:text-primary" href="/sign-in">
            Sign in
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
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Your full name"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
            onChange={(e) => setShowOrgFields(e.target.value === 'customer')}
          >
            <option value="">Select a role</option>
            <option value="customer">Customer</option>
            <option value="agent">Support Agent</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {showOrgFields && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_id">Organization</Label>
              <select
                id="organization_id"
                name="organization_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.domain})
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Select your organization or create a new one below
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_name">New Organization Name</Label>
              <Input
                id="organization_name"
                name="organization_name"
                type="text"
                placeholder="Your company name"
              />
              <p className="text-sm text-muted-foreground">
                Only fill this if you need to create a new organization
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_domain">New Organization Domain</Label>
              <Input
                id="organization_domain"
                name="organization_domain"
                type="text"
                placeholder="company.com"
              />
              <p className="text-sm text-muted-foreground">
                Optional: If not provided, we'll use your email domain
              </p>
            </div>
          </div>
        )}

        <SubmitButton
          className="w-full"
          formAction={signUpAction}
          pendingText="Signing up..."
        >
          Sign up
        </SubmitButton>

        {messageObj && <FormMessage message={messageObj} />}
      </div>
    </form>
  );
} 