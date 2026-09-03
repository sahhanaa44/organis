import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "../../components/DashboardShell.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/admin/dashboard", label: "Overview", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/donors", label: "Donors" },
  { to: "/admin/recipients", label: "Recipients" },
  { to: "/admin/organs", label: "Organs" },
  { to: "/admin/matches", label: "Matches" },
  { to: "/admin/allocations", label: "Allocations" },
  { to: "/admin/analytics", label: "Analytics" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminAnalytics() {
  const [monthly, setMonthly] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: dash }, { data: audit }] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/audit-logs"),
      ]);
      setMonthly(
        (dash.monthlyAllocations || []).map((m) => ({
          label: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
          count: m.count,
        }))
      );
      setLogs(audit.logs || []);
    })();
  }, []);

  return (
    <DashboardShell title="Analytics" subtitle="Admin" tabs={TABS}>
      <div className="card mb-8 p-6">
        <p className="mb-4 text-sm font-medium text-charcoal">Allocations over time</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EC" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7C776C" }} />
            <YAxis tick={{ fontSize: 11, fill: "#7C776C" }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E2DB", fontSize: 12 }} />
            <Line type="monotone" dataKey="count" stroke="#2F4A36" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <p className="mb-4 text-sm font-medium text-charcoal">Audit log</p>
        <div className="divide-y divide-stone-100">
          {logs.map((l) => (
            <div key={l._id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-charcoal">{l.action}</p>
                <p className="text-xs text-stone-400">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                {l.actor?.name} ({l.actor?.role}) · {l.entityType}
              </p>
            </div>
          ))}
          {logs.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No audit activity yet.</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
