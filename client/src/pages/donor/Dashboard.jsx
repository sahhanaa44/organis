import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartHandshake, ShieldCheck, ArrowRight } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/donor/dashboard", label: "Overview", end: true },
  { to: "/donor/profile", label: "Profile" },
  { to: "/donor/organs", label: "Organs" },
];

export default function DonorDashboard() {
  const [donor, setDonor] = useState(null);
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: profileData }, { data: organsData }] = await Promise.all([
          api.get("/donor/profile"),
          api.get("/donor/organs"),
        ]);
        setDonor(profileData.donor);
        setOrgans(organsData.organs || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell title="Donor overview" subtitle="Donor" tabs={TABS}>
      {loading ? (
        <p className="text-sm text-stone-400">Loading your information…</p>
      ) : !donor ? (
        <div className="card p-10 text-center">
          <HeartHandshake size={28} className="mx-auto text-forest-600" strokeWidth={1.5} />
          <h2 className="mt-4 text-2xl">Complete your donor profile</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            We need a few medical details before you can register organ availability or give consent.
          </p>
          <Link to="/donor/profile" className="btn-primary mt-6 inline-flex">
            Complete profile <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-charcoal">Consent status</p>
              <Badge tone={donor.consentGiven ? "success" : "warning"}>
                {donor.consentGiven ? "Consent given" : "Consent pending"}
              </Badge>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-stone-400">Blood group</p>
                <p className="mt-1 font-medium text-charcoal">{donor.bloodGroup}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Status</p>
                <p className="mt-1"><Badge status={donor.status} /></p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Registered hospital</p>
                <p className="mt-1 font-medium text-charcoal">{donor.registeredHospital?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Organs registered</p>
                <p className="mt-1 font-medium text-charcoal">{organs.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <ShieldCheck size={20} className="text-forest-600" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-charcoal">Human-reviewed, always</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              Your registered organs are only analyzed for compatibility after your explicit consent. Every match is
              reviewed by hospital staff before any allocation proceeds.
            </p>
          </motion.div>

          <div className="card p-6 md:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-charcoal">Your registered organs</p>
              <Link to="/donor/organs" className="text-xs text-forest-600 hover:underline">
                Manage organs →
              </Link>
            </div>
            {organs.length === 0 ? (
              <p className="text-sm text-stone-400">No organs registered yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {organs.map((o) => (
                  <div key={o._id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium capitalize text-charcoal">{o.organType} · {o.code}</p>
                      <p className="text-xs text-stone-400">{o.procurementHospital?.name}</p>
                    </div>
                    <Badge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
