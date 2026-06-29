import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus, LeadPriority, LeadSource } from "@/lib/leads.constants";

function getSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: string }).message ?? "").trim();
    if (message) return message;
  }
  return fallback;
}

function logSupabaseError(context: string, error: unknown) {
  console.error(`[Supabase] ${context} failed`, error);
}

export interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to: string | null;
  follow_up_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string | null;
  author_name: string | null;
  message: string;
  created_at: string;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    logSupabaseError("fetchLeads", error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to load leads from Supabase."));
  }
  return (data ?? []) as Lead[];
}

export async function fetchLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { data, error } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    logSupabaseError(`fetchLeadNotes(${leadId})`, error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to load lead notes from Supabase."));
  }
  return (data ?? []) as LeadNote[];
}

export async function createLead(
  input: Omit<Lead, "id" | "created_at" | "updated_at" | "created_by" | "assigned_to"> & {
    assigned_to?: string | null;
  },
  userId: string,
) {
  const { error } = await supabase.from("leads").insert({
    ...input,
    created_by: userId,
    assigned_to: input.assigned_to ?? userId,
  });
  if (error) {
    logSupabaseError("createLead", error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to create the lead in Supabase."));
  }
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) {
    logSupabaseError(`updateLead(${id})`, error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to update the lead in Supabase."));
  }
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) {
    logSupabaseError(`deleteLead(${id})`, error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to delete the lead from Supabase."));
  }
}

export async function addLeadNote(leadId: string, message: string, userId: string, authorName: string | null) {
  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    author_id: userId,
    author_name: authorName,
    message,
  });
  if (error) {
    logSupabaseError(`addLeadNote(${leadId})`, error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to save the lead note in Supabase."));
  }
}

export async function deleteLeadNote(noteId: string) {
  const { error } = await supabase.from("lead_notes").delete().eq("id", noteId);
  if (error) {
    logSupabaseError(`deleteLeadNote(${noteId})`, error);
    throw new Error(getSupabaseErrorMessage(error, "Unable to delete the lead note from Supabase."));
  }
}
