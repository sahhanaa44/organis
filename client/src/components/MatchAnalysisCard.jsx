import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Info } from "lucide-react";

/**
 * Renders a single candidate's AI match result: headline compatibility
 * score, an animated factor-weight breakdown, and the plain-language
 * reasons behind the recommendation. Designed to make the model's output
 * legible rather than a black-box percentage.
 */
export default function MatchAnalysisCard({ result, rank }) {
  const [open, setOpen] = useState(false);

  if (result.disqualified) {
    return (
      <div className="card p-5 opacity-70">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-charcoal">{result.name || "Candidate"}</p>
          <span className="badge bg-rose-50 text-rose-600">Not eligible</span>
        </div>
        <p className="mt-2 text-xs text-stone-500">{result.disqualificationReason || result.disqualification_reason}</p>
      </div>
    );
  }

  const score = result.compatibilityScore ?? result.compatibility_score ?? 0;
  const factors = result.factors || [];
  const reasons = result.reasons || [];

  return (
    <motion.div layout className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-sm font-medium text-forest-700">
            #{rank}
          </div>
          <div>
            <p className="text-sm font-medium text-charcoal">{result.name || "Candidate"}</p>
            <p className="text-xs text-stone-500">Priority rank {rank}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-serif text-2xl text-forest-700">{score.toFixed(1)}%</p>
            <p className="text-[11px] uppercase tracking-wide text-stone-400">Compatibility</p>
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={18} className="text-stone-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-stone-100"
          >
            <div className="grid gap-6 p-5 md:grid-cols-2">
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
                  <Info size={13} /> Factor breakdown
                </p>
                <div className="space-y-3">
                  {factors.map((f, i) => (
                    <div key={f.key || f.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-stone-600">
                          {f.label} <span className="text-stone-400">({f.weightPct ?? f.weight_pct}%)</span>
                        </span>
                        <span className="font-medium text-charcoal">{(f.contributionPct ?? f.contribution_pct).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((f.rawScore ?? f.raw_score) * 100).toFixed(0)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                          className="h-full rounded-full bg-forest-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">Why this recommendation?</p>
                <ul className="space-y-2">
                  {reasons.map((r, i) => (
                    <motion.li
                      key={r}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2 text-sm text-stone-700"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-forest-600" />
                      {r}
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg bg-sage-50 p-3 text-[11px] leading-relaxed text-forest-800">
                  This is a decision-support output only. Final allocation requires review by qualified clinical and
                  authorized allocation personnel.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
