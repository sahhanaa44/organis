import React, { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
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

export default function AdminRecipients() {
  const [recipients, setRecipients] = useState([]);
  const [urgency, setUrgency] = useState("");
  const [requiredOrgan, setRequiredOrgan] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/admin/recipients", { params: { urgency, requiredOrgan } });
      setRecipients(data.recipients || []);
    })();
  }, [urgency, requiredOrgan]);

  return (
    <DashboardShell title="Recipients" subtitle="Admin" tabs={TABS}>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="input-field w-auto" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="">All urgency levels</option>
          {["low", "medium", "high", "critical"].map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="input-field w-auto" value={requiredOrgan} onChange={(e) => setRequiredOrgan(e.target.value)}>
          <option value="">All organs</option>
          {["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"].map((o) => (
            <option key={o} value={o}>{o.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Organ</th>
              <th className="px-5 py-3 font-medium">Blood group</th>
              <th className="px-5 py-3 font-medium">Urgency</th>
              <th className="px-5 py-3 font-medium">Waiting</th>
              <th className="px-5 py-3 font-medium">Stage</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r._id} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-3.5 font-medium text-charcoal">{r.user?.name}</td>
                <td className="px-5 py-3.5 capitalize text-stone-600">{r.requiredOrgan}</td>
                <td className="px-5 py-3.5 text-stone-600">{r.bloodGroup}</td>
                <td className="px-5 py-3.5"><Badge status={r.urgency} /></td>
                <td className="px-5 py-3.5 text-stone-600">{r.waitingDays ?? 0}d</td>
                <td className="px-5 py-3.5"><Badge status={r.waitlistStage} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {recipients.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No recipients found.</p>}
      </div>
    </DashboardShell>
  );
}
