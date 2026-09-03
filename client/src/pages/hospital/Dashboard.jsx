import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Users, ScanSearch, Activity } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import AnimatedNumber from "../../components/AnimatedNumber.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/hospital/dashboard", label: "Overview", end: true },
  { to: "/hospital/organs", label: "Organs" },
  { to: "/hospital/matches", label: "Matches" },
  { to: "/hospital/allocations", label: "Allocations" },
];

export default function HospitalDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/hospital/dashboard");
      setData(data);
    })();
  }, []);

  const stats = data?.stats || {};

  const cards = [
    { label: "Available organs", value: stats.availableOrgans ?? 0, icon: HeartPulse },
    { label: "Active recipients", value: stats.activeRecipients ?? 0, icon: Users },
    { label: "Pending matches", value: stats.pendingMatches ?? 0, icon: ScanSearch },
    { label: "Active allocations", value: stats.activeAllocations ?? 0, icon: Activity },
  ];

  return (
    <DashboardShell title={data?.hospital?.name || "Overview"} subtitle="Hospital" tabs={TABS}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-6">
            <c.icon size={20} strokeWidth={1.5} className="text-forest-600" />
            <p className="mt-4 font-serif text-3xl text-ink">
              <AnimatedNumber value={c.value} />
            </p>
            <p className="mt-1 text-xs text-stone-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <p className="mb-4 text-sm font-medium text-charcoal">Recent allocation activity</p>
        <div className="divide-y divide-stone-100">
          {(data?.recentAllocations || []).length === 0 && (
            <p className="py-6 text-center text-sm text-stone-400">No allocation activity yet.</p>
          )}
          {(data?.recentAllocations || []).map((a) => (
            <div key={a._id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium capitalize text-charcoal">{a.organ?.organType} · {a.organ?.code}</p>
                <p className="text-xs text-stone-400">Recipient: {a.recipient?.user?.name || "—"}</p>
              </div>
              <Badge status={a.currentStage} />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
