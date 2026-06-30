import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Nimbus CRM" },
      { name: "description", content: "Sign in to your Nimbus CRM workspace." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const pwSchema = z.string().min(6, "Min 6 characters").max(128);
const nameSchema = z.string().trim().min(1, "Required").max(80);

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  // sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPw, setSiPw] = useState("");
  // sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = emailSchema.safeParse(siEmail);
    const pp = pwSchema.safeParse(siPw);
    if (!ep.success) return toast.error(ep.error.issues[0].message);
    if (!pp.success) return toast.error(pp.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ep.data, password: pp.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nameSchema.safeParse(suName);
    const ep = emailSchema.safeParse(suEmail);
    const pp = pwSchema.safeParse(suPw);
    if (!n.success) return toast.error(n.error.issues[0].message);
    if (!ep.success) return toast.error(ep.error.issues[0].message);
    if (!pp.success) return toast.error(pp.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: ep.data,
      password: pp.data,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: n.data },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're in");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute -top-24 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[320px] w-[360px] rounded-full bg-secondary/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-2xl"
      >
        <div className="mb-8 rounded-[1.5rem] border border-border bg-card/90 p-8 shadow-[0_40px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-3 rounded-[1.5rem] border border-border/80 bg-background/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Nimbus CRM</p>
              <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-foreground sm:text-4xl">
                Streamline your leads with premium clarity.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                A modern workspace built for teams who want fast lead tracking, intelligent follow-ups, and polished insights.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Button className="min-w-[160px] px-6 py-3" size="lg" onClick={() => setActiveTab("signin")}>Sign in</Button>
            <Button variant="outline" className="min-w-[160px] px-6 py-3" size="lg" onClick={() => setActiveTab("signup")}>Create account</Button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6 rounded-[1.25rem] border border-border/80 bg-background/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-primary">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-semibold">Fast access</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Log in or sign up instantly with secure authentication designed for rapid CRM workflows.
              </p>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Secure</p>
                  <p className="mt-2 text-sm text-foreground">Email and password authentication with strong validation.</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/90 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Responsive</p>
                  <p className="mt-2 text-sm text-foreground">Optimized for desktop, tablet, and mobile user journeys.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/80 bg-background/80 p-6 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" aria-label="Sign in email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="si-pw">Password</Label>
                      <Input id="si-pw" type="password" value={siPw} onChange={(e) => setSiPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" aria-label="Sign in password" />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-name">Full name</Label>
                      <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" aria-label="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" aria-label="Sign up email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-pw">Password</Label>
                      <Input id="su-pw" type="password" value={suPw} onChange={(e) => setSuPw(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" aria-label="Sign up password" />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      The first user to sign up becomes the workspace admin.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
