import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, isAfter } from "date-fns";
import {
  Search, Filter as FilterIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox, AlertTriangle,
} from "lucide-react";

import { fetchLeads, type Lead } from "@/services/leads";
import {
  LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES,
  STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS,
  STATUS_STYLES, PRIORITY_STYLES,
} from "@/lib/leads.constants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads · Nimbus CRM" }] }),
  component: LeadsPage,
});

type SortKey = "full_name" | "company" | "status" | "created_at";
const PAGE_SIZE = 10;

function LeadsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((l) => {
      const qq = q.trim().toLowerCase();
      if (qq) {
        const hay = `${l.full_name} ${l.email} ${l.phone ?? ""} ${l.company ?? ""}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      if (status !== "all" && l.status !== status) return false;
      if (priority !== "all" && l.priority !== priority) return false;
      if (source !== "all" && l.source !== source) return false;
      return true;
    });
    list.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data, q, status, priority, source, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-foreground">
      {label}
      {sortKey === k && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone, company…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              {LEAD_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <CreateLeadDialog />
      </div>

      <Card className="overflow-hidden border-border bg-card p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No leads match</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try clearing filters, or create your first lead to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium"><SortBtn k="full_name" label="Name" /></th>
                  <th className="px-4 py-3 text-left font-medium"><SortBtn k="company" label="Company" /></th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium"><SortBtn k="status" label="Status" /></th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Follow-up</th>
                  <th className="px-4 py-3 text-left font-medium"><SortBtn k="created_at" label="Created" /></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((l, i) => {
                  const overdue =
                    l.follow_up_date &&
                    isAfter(new Date(), new Date(l.follow_up_date)) &&
                    l.status !== "converted" && l.status !== "lost";
                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.015 }}
                      onClick={() => { setSelected(l); setOpen(true); }}
                      className="cursor-pointer border-t border-border/60 transition-colors hover:bg-accent/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{l.full_name}</p>
                        {l.job_title && <p className="text-xs text-muted-foreground">{l.job_title}</p>}
                      </td>
                      <td className="px-4 py-3">{l.company ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs">{l.email}</p>
                        {l.phone && <p className="text-xs text-muted-foreground">{l.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{SOURCE_LABELS[l.source]}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", STATUS_STYLES[l.status])}>
                          {STATUS_LABELS[l.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", PRIORITY_STYLES[l.priority])}>
                          {PRIORITY_LABELS[l.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {l.follow_up_date ? (
                          <span className={cn("inline-flex items-center gap-1", overdue && "text-warning")}>
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            {format(new Date(l.follow_up_date), "MMM d, yyyy")}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(l.created_at), "MMM d, yyyy")}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">{safePage} / {pages}</span>
              <Button variant="ghost" size="icon" disabled={safePage === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <LeadDetailDialog lead={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
