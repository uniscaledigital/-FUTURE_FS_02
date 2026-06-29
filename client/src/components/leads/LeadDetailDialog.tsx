import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, Trash2, Send, AlertTriangle } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  type Lead, updateLead, deleteLead, addLeadNote, deleteLeadNote, fetchLeadNotes,
} from "@/services/leads";
import {
  LEAD_STATUSES, LEAD_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, STATUS_STYLES, PRIORITY_STYLES,
} from "@/lib/leads.constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LeadDetailDialog({ lead, open, onOpenChange }: Props) {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  useEffect(() => {
    if (lead) setDraft({
      status: lead.status, priority: lead.priority, company: lead.company,
      job_title: lead.job_title, follow_up_date: lead.follow_up_date,
    });
  }, [lead]);

  const { data: notes } = useQuery({
    queryKey: ["lead-notes", lead?.id],
    queryFn: () => fetchLeadNotes(lead!.id),
    enabled: !!lead && open,
  });

  if (!lead) return null;

  const canEdit = role === "admin" || lead.assigned_to === user?.id;
  const canDelete = role === "admin";

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        ...draft,
        follow_up_date: draft.follow_up_date ? new Date(draft.follow_up_date).toISOString() : null,
      };
      await updateLead(lead.id, patch);
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteLead(lead.id);
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const postNote = async () => {
    if (!user || !note.trim()) return;
    setPostingNote(true);
    try {
      await addLeadNote(
        lead.id,
        note.trim(),
        user.id,
        user.user_metadata?.full_name ?? user.email ?? null,
      );
      setNote("");
      qc.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPostingNote(false);
    }
  };

  const followUpInput = draft.follow_up_date
    ? new Date(draft.follow_up_date).toISOString().slice(0, 10)
    : "";

  const overdue =
    lead.follow_up_date &&
    new Date(lead.follow_up_date) < new Date() &&
    lead.status !== "converted" &&
    lead.status !== "lost";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{lead.full_name}</span>
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", STATUS_STYLES[lead.status])}>
                {STATUS_LABELS[lead.status]}
              </span>
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", PRIORITY_STYLES[lead.priority])}>
                {PRIORITY_LABELS[lead.priority]}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background/40 p-4 text-sm">
                <p><span className="text-muted-foreground">Email:</span> {lead.email}</p>
                {lead.phone && <p><span className="text-muted-foreground">Phone:</span> {lead.phone}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>

              {overdue && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Follow-up overdue
                </div>
              )}

              <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-60">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={draft.status ?? lead.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={draft.priority ?? lead.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEAD_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Input value={draft.company ?? ""} onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input value={draft.job_title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, job_title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Next follow-up</Label>
                  <Input type="date" value={followUpInput} onChange={(e) => setDraft((d) => ({ ...d, follow_up_date: e.target.value }))} />
                </div>
                <Button onClick={save} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </fieldset>
            </div>

            <div className="flex flex-col">
              <Label className="mb-2">Notes & activity</Label>
              <div className="flex gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a follow-up note…"
                  rows={2}
                  className="resize-none"
                />
                <Button size="icon" onClick={postNote} disabled={postingNote || !note.trim()} title="Post note">
                  {postingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <ScrollArea className="mt-3 h-80 rounded-lg border border-border bg-background/40 p-3">
                {!notes || notes.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">No notes yet</p>
                ) : (
                  <ol className="relative space-y-3 border-l border-border pl-4">
                    {notes.map((n) => (
                      <li key={n.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="rounded-md bg-card p-3">
                          <p className="text-sm leading-relaxed">{n.message}</p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span>{n.author_name ?? "Unknown"}</span>
                            <div className="flex items-center gap-2">
                              <span>{format(new Date(n.created_at), "MMM d, HH:mm")}</span>
                              {(n.author_id === user?.id || role === "admin") && (
                                <button
                                  onClick={async () => {
                                    await deleteLeadNote(n.id);
                                    qc.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
                                  }}
                                  className="text-destructive hover:opacity-80"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="mt-2">
            {canDelete && (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete lead
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead and its notes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:opacity-90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
