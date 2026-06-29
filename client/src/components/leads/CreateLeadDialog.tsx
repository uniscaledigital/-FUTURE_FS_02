import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createLead, type Lead } from "@/services/leads";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { LEAD_PRIORITIES, LEAD_SOURCES, PRIORITY_LABELS, SOURCE_LABELS } from "@/lib/leads.constants";

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  job_title: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES),
  priority: z.enum(LEAD_PRIORITIES),
  follow_up_date: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function CreateLeadDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "", email: "", phone: "", company: "", job_title: "",
      source: "website", priority: "medium", follow_up_date: "",
    },
  });

  const onSubmit = async (v: FormValues) => {
    if (!user) return;
    setBusy(true);
    try {
      await createLead(
        {
          full_name: v.full_name,
          email: v.email,
          phone: v.phone || null,
          company: v.company || null,
          job_title: v.job_title || null,
          source: v.source,
          status: "new",
          priority: v.priority,
          follow_up_date: v.follow_up_date ? new Date(v.follow_up_date).toISOString() : null,
        } as Omit<Lead, "id" | "created_at" | "updated_at" | "created_by" | "assigned_to">,
        user.id,
      );
      toast.success("Lead created");
      qc.invalidateQueries({ queryKey: ["leads"] });
      form.reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create lead");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Full name</Label>
            <Input {...form.register("full_name")} placeholder="Jane Cooper" />
            {form.formState.errors.full_name && <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} placeholder="jane@acme.com" />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...form.register("phone")} placeholder="+1 555 ..." />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input {...form.register("company")} placeholder="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label>Job title</Label>
            <Input {...form.register("job_title")} placeholder="Head of Ops" />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Follow-up date</Label>
            <Input type="date" {...form.register("follow_up_date")} />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
