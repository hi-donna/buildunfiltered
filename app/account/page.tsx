import type { Metadata } from "next";
import AccountFlow from "@/components/AccountFlow";
import { assignable } from "@/lib/codenames";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to build.unfiltered with your phone. A code by SMS, no password.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account/" },
};

// Nothing on the site is gated. Signing in gives you a name from the list and
// a way for us to reach you; that is all it does today.
export default function AccountPage() {
  return (
    <div className="wrap auth">
      <p className="eyebrow" style={{ marginTop: 36 }}>Account</p>
      <h1 className="finder-title">Sign in</h1>
      <p className="finder-lede">
        Your phone number is the account. We text a code, you type it, you are in.
        First time, we also ask for an email. Everyone gets a name from the list of {assignable.length}; first come, first served.
      </p>
      <AccountFlow />
    </div>
  );
}
