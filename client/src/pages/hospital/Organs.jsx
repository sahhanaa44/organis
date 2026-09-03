import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ScanSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/hospital/dashboard", label: "Overview", end: true },
  { to: "/hospital/organs", label: "Organs" },
  { to: "/hospital/matches", label: "Matches" },
  { to: "/hospital/allocations", label: "Allocations" },
];

export default function HospitalOrgans() {
  const [organs, setOrgans] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get("/organs", { params: { q, status } });
    setOrgans(data.organs || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const runMatch = async (organId) => {
    setRunning(organId);
    try {
      const { data } = await api.post("/matches/run", { organId });
      if (data.match) navigate(`/hospital/matches?matchId=${data.match._id}`);
      else load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not run matching.");
    } finally {
      setRunning(null);
    }
  };

  return (
    <DashboardShell title="Organs" subtitle="Hospital" tabs={TABS}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by organ code..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["available", "matching_in_progress", "matched", "allocated", "transplanted"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
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
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {organs.map((o, i) => (
              <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-3.5 font-medium text-charcoal">{o.code}</td>
                <td className="px-5 py-3.5 capitalize text-stone-600">{o.organType}</td>
                <td className="px-5 py-3.5 text-stone-600">{o.bloodGroup}</td>
                <td className="px-5 py-3.5"><Badge status={o.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  {o.status === "available" && (
                    <button
                      onClick={() => runMatch(o._id)}
                      disabled={running === o._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-forest-200 px-3 py-1.5 text-xs font-medium text-forest-700 transition-colors hover:bg-forest-50 disabled:opacity-50"
                    >
                      <ScanSearch size={13} /> {running === o._id ? "Analyzing..." : "Run AI matching"}
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {organs.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No organs found.</p>}
      </div>
    </DashboardShell>
  );
}
