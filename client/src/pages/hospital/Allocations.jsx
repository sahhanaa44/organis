import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import WorkflowDiagram from "../../components/WorkflowDiagram.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/hospital/dashboard", label: "Overview", end: true },
  { to: "/hospital/organs", label: "Organs" },
  { to: "/hospital/matches", label: "Matches" },
  { to: "/hospital/allocations", label: "Allocations" },
];

const STAGES = [
  "eligibility_check",
  "ai_matching",
  "candidate_ranking",
  "human_review",
  "allocation_pending",
  "approved",
  "transplant_scheduled",
  "completed",
];

const NEXT_STAGE = {
  human_review: "allocation_pending",
  allocation_pending: "approved",
  approved: "transplant_scheduled",
  transplant_scheduled: "completed",
};

export default function HospitalAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scheduledFor, setScheduledFor] = useState("");

  const load = async () => {
    const { data } = await api.get("/allocations");
    setAllocations(data.allocations || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openAllocation = async (id) => {
    const { data } = await api.get(`/allocations/${id}`);
    setSelected(data.allocation);
  };

  const advance = async (stage) => {
    const body = stage === "transplant_scheduled" ? { stage, transplantScheduledFor: scheduledFor } : { stage };
    const { data } = await api.post(`/allocations/${selected._id}/advance`, body);
    setSelected(data.allocation);
    load();
  };

  const activeIndex = selected ? STAGES.indexOf(selected.currentStage) : -1;
  const nextStage = selected ? NEXT_STAGE[selected.currentStage] : null;

  return (
    <DashboardShell title="Allocations" subtitle="Hospital" tabs={TABS}>
      {!selected ? (
        <div className="space-y-3">
          {allocations.map((a, i) => (
            <motion.button
              key={a._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openAllocation(a._id)}
              className="card flex w-full items-center justify-between p-5 text-left transition-shadow hover:shadow-lifted"
            >
              <div>
                <p className="font-medium capitalize text-charcoal">{a.organ?.organType} · {a.organ?.code}</p>
                <p className="text-xs text-stone-400">Recipient: {a.recipient?.user?.name || "—"}</p>
              </div>
              <Badge status={a.currentStage} />
            </motion.button>
          ))}
          {allocations.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No allocations yet.</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="mb-6 text-xs text-stone-500 hover:text-charcoal">
            ← Back to allocations
          </button>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card p-8 md:col-span-2">
              <WorkflowDiagram
                stages={STAGES.map((s) => ({ label: s.replace(/_/g, " ") }))}
                activeIndex={activeIndex + 1}
              />
            </div>
            <div className="space-y-6">
              <div className="card p-6">
                <p className="text-xs text-stone-400">Organ</p>
                <p className="mt-1 font-medium capitalize text-charcoal">{selected.organ?.organType} · {selected.organ?.code}</p>
                <p className="mt-4 text-xs text-stone-400">Recipient</p>
                <p className="mt-1 font-medium text-charcoal">{selected.recipient?.user?.name}</p>
                <p className="mt-4 text-xs text-stone-400">Compatibility at allocation</p>
                <p className="mt-1 font-medium text-forest-700">{selected.compatibilityScoreAtAllocation}%</p>
              </div>

              {nextStage && (
                <div className="card p-6">
                  <p className="mb-3 text-sm font-medium text-charcoal">Advance stage</p>
                  {nextStage === "transplant_scheduled" && (
                    <input
                      type="datetime-local"
                      className="input-field mb-3"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                  )}
                  <button onClick={() => advance(nextStage)} className="btn-primary w-full">
                    Mark as {nextStage.replace(/_/g, " ")}
                  </button>
                  {selected.currentStage === "human_review" && (
                    <button
                      onClick={() => advance("rejected")}
                      className="mt-2 w-full rounded-full border border-rose-200 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Reject allocation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
