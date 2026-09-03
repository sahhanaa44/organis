import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import MatchAnalysisCard from "../../components/MatchAnalysisCard.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/hospital/dashboard", label: "Overview", end: true },
  { to: "/hospital/organs", label: "Organs" },
  { to: "/hospital/matches", label: "Matches" },
  { to: "/hospital/allocations", label: "Allocations" },
];

const SCAN_STEPS = ["Scanning eligible recipients...", "Analyzing compatibility...", "Ranking candidates..."];

export default function HospitalMatches() {
  const [params] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scanStep, setScanStep] = useState(-1);
  const [reviewNotes, setReviewNotes] = useState("");
  const [chosenRecipient, setChosenRecipient] = useState(null);

  const load = async () => {
    const { data } = await api.get("/matches");
    setMatches(data.matches || []);
  };

  const openMatch = async (id) => {
    setScanStep(0);
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 380));
      setScanStep(i + 1);
    }
    const { data } = await api.get(`/matches/${id}`);
    setSelected(data.match);
    setScanStep(-1);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const matchId = params.get("matchId");
    if (matchId) openMatch(matchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submitReview = async () => {
    if (!chosenRecipient) return;
    await api.post(`/matches/${selected._id}/review`, { recipientId: chosenRecipient, notes: reviewNotes });
    setSelected(null);
    setChosenRecipient(null);
    setReviewNotes("");
    load();
  };

  const eligible = (selected?.results || []).filter((r) => !r.disqualified).sort((a, b) => a.priorityRank - b.priorityRank);

  return (
    <DashboardShell title="Matches" subtitle="Hospital" tabs={TABS}>
      {!selected ? (
        <div className="space-y-3">
          {matches.map((m, i) => (
            <motion.button
              key={m._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openMatch(m._id)}
              className="card flex w-full items-center justify-between p-5 text-left transition-shadow hover:shadow-lifted"
            >
              <div>
                <p className="font-medium capitalize text-charcoal">{m.organ?.organType} · {m.organ?.code}</p>
                <p className="text-xs text-stone-400">{m.eligibleCandidates} eligible candidates · {m.hospital?.name}</p>
              </div>
              <Badge status={m.status} />
            </motion.button>
          ))}
          {matches.length === 0 && (
            <p className="py-10 text-center text-sm text-stone-400">
              No matches yet. Run AI matching from the Organs tab to see results here.
            </p>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => setSelected(null)} className="mb-6 text-xs text-stone-500 hover:text-charcoal">
            ← Back to matches
          </button>

          <div className="mb-8 rounded-2xl border border-forest-100 bg-forest-50 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-forest-600">AI match analysis</p>
            <p className="mt-1 text-lg text-forest-900">
              {selected.organ?.organType} · {selected.organ?.code} — {selected.eligibleCandidates} of {selected.totalCandidates} candidates eligible
            </p>
          </div>

          <div className="space-y-3">
            {eligible.map((r) => (
              <div key={r.recipient} className="relative">
                <MatchAnalysisCard result={r} rank={r.priorityRank} />
                {selected.status === "pending_review" && (
                  <button
                    onClick={() => setChosenRecipient(String(r.recipient))}
                    className={`absolute right-5 top-5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      chosenRecipient === String(r.recipient)
                        ? "border-forest-600 bg-forest-600 text-warmwhite"
                        : "border-stone-300 text-stone-500 hover:border-forest-400"
                    }`}
                  >
                    {chosenRecipient === String(r.recipient) ? "Selected" : "Select for review"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {selected.status === "pending_review" && (
            <div className="mt-6 card p-6">
              <p className="mb-3 text-sm font-medium text-charcoal">Human review</p>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Reviewer notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <button onClick={submitReview} disabled={!chosenRecipient} className="btn-primary mt-4 disabled:opacity-40">
                Confirm selection & begin allocation
              </button>
              <p className="mt-3 text-[11px] text-stone-400">
                This action moves the selected candidate into the allocation workflow. It does not itself complete a
                transplant — further approvals are required.
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {scanStep >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lifted">
              <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-forest-600" />
              {SCAN_STEPS.map((step, i) => (
                <motion.p
                  key={step}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: scanStep === i ? 1 : scanStep > i ? 0.4 : 0.2 }}
                  className="py-1 text-sm text-charcoal"
                >
                  {step}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
