import { LoginForm } from "@/components/admin/login-form";
import type { Metadata } from "next";

// Never serve this page from a long-lived static cache: after each deployment
// the JS chunks are re-hashed, so stale HTML would reference missing chunks
// and render the preview broken/unstyled.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff login · Ceylon Ride Co.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
