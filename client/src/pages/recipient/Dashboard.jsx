import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/recipient/dashboard", label: "Overview", end: true },
  { to: "/recipient/profile", label: "Profile" },
  { to: "/recipient/waitlist", label: "Waitlist" },
];

export default function RecipientDashboard() {
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/recipient/waitlist");
        setRecipient(data.recipient);
      } catch {
        setRecipient(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <DashboardShell title="Overview" subtitle="Recipient" tabs={TABS}><p className="text-sm text-stone-400">Loading…</p></DashboardShell>;

  if (!recipient) {
    return (
      <DashboardShell title="Overview" subtitle="Recipient" tabs={TABS}>
        <div className="card p-10 text-center">
          <h2 className="text-2xl">Complete your recipient profile</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            We need your medical details to place you on the waiting list and begin compatibility analysis.
          </p>
          <Link to="/recipient/profile" className="btn-primary mt-6 inline-flex">Complete profile <ArrowRight size={15} /></Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Overview" subtitle="Recipient" tabs={TABS}>
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Required organ", value: recipient.requiredOrgan?.replace("_", " ") },
          { label: "Blood group", value: recipient.bloodGroup },
          { label: "Urgency", value: recipient.urgency, badge: true },
          { label: "Waiting since", value: `${recipient.waitingDays ?? 0} days` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5">
            <p className="text-xs text-stone-400">{s.label}</p>
            <p className="mt-1.5 text-lg font-medium capitalize text-charcoal">
              {s.badge ? <Badge status={s.value} /> : s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <p className="text-sm font-medium text-charcoal">Current status</p>
          <div className="mt-3 flex items-center gap-3">
            <Badge status={recipient.waitlistStage} />
            <span className="text-xs text-stone-400">Hospital: {recipient.hospital?.name}</span>
          </div>
          <Link to="/recipient/waitlist" className="mt-6 inline-flex items-center gap-1.5 text-sm text-forest-600 hover:underline">
            View full timeline <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card p-6">
          <Clock size={20} className="text-forest-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-charcoal">What happens next?</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            When a compatible organ becomes available, our AI engine analyzes your compatibility. You'll be notified
            immediately, and a hospital reviewer will make the final call.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
