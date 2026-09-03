import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, HeartPulse, ScanSearch, Activity, CheckCircle2, Building2 } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import AnimatedNumber from "../../components/AnimatedNumber.jsx";
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

const PIE_COLORS = ["#2F4A36", "#63886A", "#98A889", "#B4C2A6", "#CFD8C6", "#E4E2DB", "#A8A398"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/admin/dashboard");
      setData(data);
    })();
  }, []);

  const totals = data?.totals || {};

  const cards = [
    { label: "Total donors", value: totals.totalDonors, icon: Users },
    { label: "Total recipients", value: totals.totalRecipients, icon: Users },
    { label: "Available organs", value: totals.availableOrgans, icon: HeartPulse },
    { label: "Pending matches", value: totals.pendingMatches, icon: ScanSearch },
    { label: "Active allocations", value: totals.activeAllocations, icon: Activity },
    { label: "Completed", value: totals.completedAllocations, icon: CheckCircle2 },
    { label: "Partner hospitals", value: totals.totalHospitals, icon: Building2 },
  ];

  return (
    <DashboardShell title="Platform overview" subtitle="Admin" tabs={TABS}>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <c.icon size={18} strokeWidth={1.5} className="text-forest-600" />
            <p className="mt-3 font-serif text-2xl text-ink"><AnimatedNumber value={c.value ?? 0} /></p>
            <p className="mt-1 text-xs text-stone-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="mb-4 text-sm font-medium text-charcoal">Organs by type</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={(data?.organsByType || []).map((d) => ({ name: d._id, value: d.count }))}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {(data?.organsByType || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E2DB", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <p className="mb-4 text-sm font-medium text-charcoal">Allocations by stage</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(data?.allocationsByStage || []).map((d) => ({ name: d._id?.replace(/_/g, " "), count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7C776C" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#7C776C" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E2DB", fontSize: 12 }} />
              <Bar dataKey="count" fill="#3F6146" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardShell>
  );
}
