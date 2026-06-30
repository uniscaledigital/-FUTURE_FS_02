import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Trophy, TrendingDown, Phone, CalendarClock, Sparkles, ArrowUpRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { format, startOfMonth, subMonths, isAfter } from "date-fns";

import { fetchLeads, type Lead } from "@/services/leads";
import {
  LEAD_STATUSES, STATUS_LABELS, STATUS_STYLES, SOURCE_LABELS,
} from "@/lib/leads.constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Nimbus CRM" }] }),
  component: Dashboard,
});

const CHART_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#38BDF8", "#EF4444", "#A78BFA", "#F472B6", "#94A3B8"];

function StatCard({
  label, value, icon: Icon, hint, accent,
}: { label: string; value: string | number; icon: React.ElementType; hint?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-border bg-card p-6 shadow-sm shadow-slate-200/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
            {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-primary/20", accent ?? "bg-primary/15 text-primary ring-primary/30")}> 
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Dashboard() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  if (isLoading || !leads) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[1.5rem]" />
        ))}
      </div>
    );
  }

  const total = leads.length;
  const by = (s: string) => leads.filter((l) => l.status === s).length;
  const converted = by("converted");
  const lost = by("lost");
  const conversionRate = total ? Math.round((converted / total) * 100) : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = leads.filter((l) => new Date(l.created_at) >= today).length;
  const overdue = leads.filter(
    (l) => l.follow_up_date && isAfter(new Date(), new Date(l.follow_up_date)) && l.status !== "converted" && l.status !== "lost"
  ).length;

  const statusData = LEAD_STATUSES.map((s) => ({
    name: STATUS_LABELS[s],
    value: by(s),
  })).filter((d) => d.value > 0);

  const sourceMap = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceMap).map(([k, v]) => ({ name: SOURCE_LABELS[k as keyof typeof SOURCE_LABELS] ?? k, value: v }));

  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(startOfMonth(new Date()), 5 - i);
    const key = format(d, "MMM");
    const count = leads.filter((l) => {
      const c = new Date(l.created_at);
      const start = d;
      const end = i === 5 ? new Date() : subMonths(startOfMonth(new Date()), 5 - i - 1);
      return c >= start && c < end;
    }).length;
    return { month: key, leads: count };
  });

  const recent = leads.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Keep your sales pipeline moving.</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Nimbus CRM gives your team quick lead visibility, smarter follow-up timing, and polished reporting from one clean workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:auto-cols-max sm:grid-flow-col">
            <CreateLeadDialog trigger={
              <Button variant="secondary" className="min-w-[150px]">Create lead</Button>
            } />
            <Button
              variant="outline"
              className="min-w-[150px]"
              onClick={() => window.location.assign("/leads")}
            >
              View reports
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={total} icon={Users} />
        <StatCard label="New leads" value={by("new")} icon={UserPlus} accent="bg-sky-100 text-sky-700 ring-sky-200" />
        <StatCard label="Conversion rate" value={`${conversionRate}%`} icon={Trophy} accent="bg-emerald-100 text-emerald-700 ring-emerald-200" hint={`${converted} converted`} />
        <StatCard label="Overdue follow-ups" value={overdue} icon={CalendarClock} accent="bg-orange-100 text-orange-700 ring-orange-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Pipeline</p>
              <h3 className="text-lg font-semibold">Leads over time</h3>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Pipeline</p>
              <h3 className="text-lg font-semibold">Status mix</h3>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Live breakdown</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, color: "#e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Recent activity</p>
              <h3 className="text-lg font-semibold">Latest leads</h3>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Top {recent.length}</span>
          </div>
          {recent.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No recent leads yet</div>
          ) : (
            <div className="space-y-3">
              {recent.map((l) => (
                <div key={l.id} className="group flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-card px-4 py-4 transition hover:border-primary/30 hover:bg-primary/5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{l.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{l.company ?? l.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", STATUS_STYLES[l.status])}>
                      {STATUS_LABELS[l.status]}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {format(new Date(l.created_at), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Source summary</p>
            <h3 className="text-lg font-semibold">Lead sources</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, color: "#e2e8f0" }}
                  cursor={{ fill: "rgba(99,102,241,0.08)" }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
