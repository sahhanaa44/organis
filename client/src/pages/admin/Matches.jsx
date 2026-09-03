import React, { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import MatchAnalysisCard from "../../components/MatchAnalysisCard.jsx";
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


export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
  (async () => {
    const { data } = await api.get("/matches");

    console.log("MATCHES:", data.matches);

    setMatches(data.matches || []);
  })();
}, []);

  const open = async (id) => {
  console.log("CLICKED MATCH:", id);

  try {
    const { data } = await api.get(`/matches/${id}`);

    console.log("MATCH DETAIL:", JSON.stringify(data, null, 2));

    setSelected(data.match);
  } catch (err) {
    console.error("MATCH ERROR:", err);
  }
};

  return (
    <DashboardShell title="Matches" subtitle="Admin" tabs={TABS}>
      {!selected ? (
        <div className="space-y-3">
          {matches.map((m) => (
            <button key={m._id} onClick={() => open(m._id)} className="card flex w-full items-center justify-between p-5 text-left transition-shadow hover:shadow-lifted">
              <div>
                <p className="font-medium capitalize text-charcoal">{m.organ?.organType} · {m.organ?.code}</p>
                <p className="text-xs text-stone-400">{m.eligibleCandidates} eligible · {m.hospital?.name}</p>
              </div>
              <Badge status={m.status} />
            </button>
          ))}
          {matches.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No matches yet.</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="mb-6 text-xs text-stone-500 hover:text-charcoal">← Back to matches</button>
          <div className="space-y-3">
            {selected.results.filter((r) => !r.disqualified).sort((a, b) => a.priorityRank - b.priorityRank).map((r) => (
              <MatchAnalysisCard key={r.recipient} result={r} rank={r.priorityRank} />
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
