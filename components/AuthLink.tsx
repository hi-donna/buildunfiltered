"use client";
import { useEffect, useState } from "react";
import { supabase, authConfigured } from "@/lib/supabase";

// Header link: "Sign in" until there is a session, then the codename. Reads the
// profile once; nothing else on the site depends on being signed in. Renders
// nothing at all until the Supabase keys are set at build time, so the button
// does not show on a site where sign-in cannot work yet.
export default function AuthLink() {
  const [label, setLabel] = useState("Sign in");

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let live = true;
    const read = async () => {
      const { data } = await sb.auth.getSession();
      if (!live) return;
      if (!data.session) { setLabel("Sign in"); return; }
      const { data: p } = await sb.from("profiles").select("codename").eq("id", data.session.user.id).maybeSingle();
      if (live) setLabel(p?.codename ?? "Account");
    };
    read();
    const { data: sub } = sb.auth.onAuthStateChange(() => { read(); });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!authConfigured) return null;
  return <a className="head-auth" href="/account/">{label}</a>;
}
