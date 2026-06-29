export const LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "qualified",
  "proposal_sent",
  "negotiation",
  "converted",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_SOURCES = [
  "website",
  "referral",
  "social",
  "email",
  "event",
  "cold_call",
  "advertisement",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  converted: "Converted",
  lost: "Lost",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  referral: "Referral",
  social: "Social",
  email: "Email",
  event: "Event",
  cold_call: "Cold Call",
  advertisement: "Advertisement",
  other: "Other",
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-info/15 text-info border border-info/30",
  contacted: "bg-primary/15 text-primary border border-primary/30",
  follow_up: "bg-warning/15 text-warning border border-warning/30",
  qualified: "bg-info/15 text-info border border-info/30",
  proposal_sent: "bg-accent text-accent-foreground border border-primary/30",
  negotiation: "bg-warning/15 text-warning border border-warning/30",
  converted: "bg-success/15 text-success border border-success/30",
  lost: "bg-destructive/15 text-destructive border border-destructive/30",
};

export const PRIORITY_STYLES: Record<LeadPriority, string> = {
  low: "bg-muted text-muted-foreground border border-border",
  medium: "bg-info/15 text-info border border-info/30",
  high: "bg-destructive/15 text-destructive border border-destructive/30",
};
