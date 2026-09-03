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

export default function AdminOrgans() {
  const [organs, setOrgans] = useState([]);
  const [status, setStatus] = useState("");
  const [organType, setOrganType] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/organs", { params: { status, organType } });
      setOrgans(data.organs || []);
    })();
  }, [status, organType]);

  return (
    <DashboardShell title="Organs" subtitle="Admin" tabs={TABS}>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["available", "matching_in_progress", "matched", "allocated", "transplanted"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={organType} onChange={(e) => setOrganType(e.target.value)}>
          <option value="">All organ types</option>
          {["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"].map((o) => (
            <option key={o} value={o}>{o.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Blood group</th>
              <th className="px-5 py-3 font-medium">Hospital</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {organs.map((o) => (
              <tr key={o._id} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-3.5 font-medium text-charcoal">{o.code}</td>
                <td className="px-5 py-3.5 capitalize text-stone-600">{o.organType}</td>
                <td className="px-5 py-3.5 text-stone-600">{o.bloodGroup}</td>
                <td className="px-5 py-3.5 text-stone-600">{o.procurementHospital?.name}</td>
                <td className="px-5 py-3.5"><Badge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {organs.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No organs found.</p>}
      </div>
    </DashboardShell>
  );
}
