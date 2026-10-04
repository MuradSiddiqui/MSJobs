import { AuthCard } from "@/components/auth/auth-card";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Check your email" footer={<Link href="/login">Back to login</Link>}>
      <p className="text-sm text-muted-foreground">
        We sent a verification link. Confirm the address, then log in.
      </p>
    </AuthCard>
  );
}
