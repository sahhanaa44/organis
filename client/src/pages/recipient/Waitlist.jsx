import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/DashboardShell.jsx";
import WorkflowDiagram from "../../components/WorkflowDiagram.jsx";
import Badge from "../../components/Badge.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/recipient/dashboard", label: "Overview", end: true },
  { to: "/recipient/profile", label: "Profile" },
  { to: "/recipient/waitlist", label: "Waitlist" },
];

const STAGES = [
  { key: "registration", label: "Registration", description: "Your recipient profile is on file." },
  { key: "medical_review", label: "Medical Review", description: "Care team confirms eligibility." },
  { key: "waiting_list", label: "Waiting List", description: "Actively waiting for a compatible organ." },
  { key: "potential_match", label: "Potential Match", description: "AI has found a compatible candidate match." },
  { key: "human_review", label: "Human Review", description: "Hospital staff are reviewing the match." },
  { key: "allocation", label: "Allocation", description: "Transplant coordination is underway." },
];

export default function RecipientWaitlist() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/recipient/waitlist");
        setData(data);
      } catch {
        setData(null);
      }
    })();
  }, []);

  if (!data?.recipient) {
    return (
      <DashboardShell title="Waitlist" subtitle="Recipient" tabs={TABS}>
        <p className="text-sm text-stone-400">Complete your profile to join the waiting list.</p>
      </DashboardShell>
    );
  }

  const activeIndex = STAGES.findIndex((s) => s.key === data.recipient.waitlistStage);

  return (
    <DashboardShell title="Your waitlist status" subtitle="Recipient" tabs={TABS}>
      <div className="grid gap-10 md:grid-cols-3">
        <div className="card p-8 md:col-span-2">
          <WorkflowDiagram stages={STAGES} activeIndex={activeIndex} />
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Current stage</p>
            <p className="mt-2 font-serif text-2xl text-forest-700">{STAGES[activeIndex]?.label || "—"}</p>
            <p className="mt-2 text-xs text-stone-500">{STAGES[activeIndex]?.description}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <p className="text-sm font-medium text-charcoal">Recent match activity</p>
            <div className="mt-4 space-y-3">
              {(data.matchActivity || []).length === 0 && (
                <p className="text-xs text-stone-400">No matches run against your profile yet.</p>
              )}
              {(data.matchActivity || []).map((m) => (
                <div key={m.matchId} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium capitalize text-charcoal">{m.organType} · {m.organCode}</p>
                    <p className="text-xs text-stone-400">{m.disqualified ? "Not eligible" : `Score: ${m.compatibilityScore}%`}</p>
                  </div>
                  <Badge status={m.status} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}
