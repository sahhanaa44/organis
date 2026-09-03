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

export default function AdminDonors() {
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/admin/donors", { params: { bloodGroup, status } });
      setDonors(data.donors || []);
    })();
  }, [bloodGroup, status]);

  return (
    <DashboardShell title="Donors" subtitle="Admin" tabs={TABS}>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="input-field w-auto" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
          <option value="">All blood groups</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending_review", "eligible", "ineligible", "inactive"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Blood group</th>
              <th className="px-5 py-3 font-medium">Hospital</th>
              <th className="px-5 py-3 font-medium">Consent</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((d) => (
              <tr key={d._id} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-3.5 font-medium text-charcoal">{d.user?.name}</td>
                <td className="px-5 py-3.5 text-stone-600">{d.bloodGroup}</td>
                <td className="px-5 py-3.5 text-stone-600">{d.registeredHospital?.name || "—"}</td>
                <td className="px-5 py-3.5"><Badge tone={d.consentGiven ? "success" : "warning"}>{d.consentGiven ? "Given" : "Pending"}</Badge></td>
                <td className="px-5 py-3.5"><Badge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {donors.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No donors found.</p>}
      </div>
    </DashboardShell>
  );
}
