import React, { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import WorkflowDiagram from "../../components/WorkflowDiagram.jsx";
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

const STAGES = ["eligibility_check", "ai_matching", "candidate_ranking", "human_review", "allocation_pending", "approved", "transplant_scheduled", "completed"];

export default function AdminAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/allocations");
      setAllocations(data.allocations || []);
    })();
  }, []);

  const open = async (id) => {
    const { data } = await api.get(`/allocations/${id}`);
    setSelected(data.allocation);
  };

  return (
    <DashboardShell title="Allocations" subtitle="Admin" tabs={TABS}>
      {!selected ? (
        <div className="space-y-3">
          {allocations.map((a) => (
            <button key={a._id} onClick={() => open(a._id)} className="card flex w-full items-center justify-between p-5 text-left transition-shadow hover:shadow-lifted">
              <div>
                <p className="font-medium capitalize text-charcoal">{a.organ?.organType} · {a.organ?.code}</p>
                <p className="text-xs text-stone-400">Recipient: {a.recipient?.user?.name || "—"} · {a.hospital?.name}</p>
              </div>
              <Badge status={a.currentStage} />
            </button>
          ))}
          {allocations.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No allocations yet.</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="mb-6 text-xs text-stone-500 hover:text-charcoal">← Back to allocations</button>
          <div className="card p-8">
            <WorkflowDiagram
              stages={STAGES.map((s) => ({ label: s.replace(/_/g, " ") }))}
              activeIndex={STAGES.indexOf(selected.currentStage) + 1}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
