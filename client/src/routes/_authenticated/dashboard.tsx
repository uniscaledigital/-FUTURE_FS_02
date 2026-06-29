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
import { Card } from "@/components/ui/card";
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
      <Card className="relative overflow-hidden border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", accent ?? "bg-primary/15 text-primary ring-primary/30")}>
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
          <Skeleton key={i} className="h-28 w-full" />
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

  // last 6 months
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(startOfMonth(new Date()), 5 - i);
    const key = format(d, "MMM");
    const count = leads.filter((l) => {
      const c = new Date(l.created_at);
      return c >= d && c < subMonths(startOfMonth(new Date()), 5 - i - 1) || (i === 5 && c >= d);
    }).length;
    return { month: key, leads: count };
  });

  const recent = leads.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={total} icon={Users} />
        <StatCard label="New" value={by("new")} icon={UserPlus} accent="bg-info/15 text-info ring-info/30" />
        <StatCard label="Converted" value={converted} icon={Trophy} accent="bg-success/15 text-success ring-success/30" hint={`${conversionRate}% conversion`} />
        <StatCard label="Lost" value={lost} icon={TrendingDown} accent="bg-destructive/15 text-destructive ring-destructive/30" />
        <StatCard label="Contacted" value={by("contacted")} icon={Phone} accent="bg-primary/15 text-primary ring-primary/30" />
        <StatCard label="Qualified" value={by("qualified")} icon={Sparkles} accent="bg-info/15 text-info ring-info/30" />
        <StatCard label="Today's leads" value={todayCount} icon={ArrowUpRight} accent="bg-accent text-accent-foreground ring-primary/30" />
        <StatCard label="Overdue follow-ups" value={overdue} icon={CalendarClock} accent="bg-warning/15 text-warning ring-warning/30" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Leads over time</h3>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months}>
                <CartesianGrid stroke="oklch(0.3 0.03 265)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.7 0.02 260)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.03 265)", border: "1px solid oklch(0.3 0.03 265)", borderRadius: 8, color: "oklch(0.95 0.01 250)" }}
                />
                <Line type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: "#6366F1", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-display text-base font-semibold">Status mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.03 265)", border: "1px solid oklch(0.3 0.03 265)", borderRadius: 8, color: "oklch(0.95 0.01 250)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.7 0.02 260)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-display text-base font-semibold">Recent leads</h3>
          {recent.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {recent.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.company ?? l.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", STATUS_STYLES[l.status])}>
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
          <h3 className="mb-4 font-display text-base font-semibold">Lead sources</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="oklch(0.3 0.03 265)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.7 0.02 260)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="oklch(0.7 0.02 260)" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.03 265)", border: "1px solid oklch(0.3 0.03 265)", borderRadius: 8, color: "oklch(0.95 0.01 250)" }}
                  cursor={{ fill: "oklch(0.28 0.03 265 / 0.4)" }}
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
