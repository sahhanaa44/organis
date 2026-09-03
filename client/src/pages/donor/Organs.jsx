import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/donor/dashboard", label: "Overview", end: true },
  { to: "/donor/profile", label: "Profile" },
  { to: "/donor/organs", label: "Organs" },
];

const ORGAN_TYPES = ["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"];

export default function DonorOrgans() {
  const [organs, setOrgans] = useState([]);
  const [donor, setDonor] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({ organType: "kidney", procurementHospital: "", viabilityHours: 24 });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [{ data: p }, { data: o }] = await Promise.all([api.get("/donor/profile"), api.get("/donor/organs")]);
    setDonor(p.donor);
    setOrgans(o.organs || []);
    try {
      const { data: h } = await api.get("/admin/hospitals");
      setHospitals(h.hospitals || []);
    } catch {
      setHospitals([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/donor/organs", form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not register organ.");
    }
  };

  return (
    <DashboardShell title="Your organs" subtitle="Donor" tabs={TABS}>
      {!donor?.consentGiven && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You need to give consent on your profile page before registering organ availability.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">{organs.length} organ{organs.length !== 1 ? "s" : ""} registered</p>
        <button onClick={() => setShowForm((s) => !s)} disabled={!donor?.consentGiven} className="btn-primary !px-4 !py-2 text-xs disabled:opacity-40">
          <Plus size={14} /> Register organ
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={submit}
          className="card mb-6 space-y-4 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Organ type</label>
              <select className="input-field" value={form.organType} onChange={(e) => setForm({ ...form, organType: e.target.value })}>
                {ORGAN_TYPES.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Procurement hospital</label>
              <select className="input-field" value={form.procurementHospital} onChange={(e) => setForm({ ...form, procurementHospital: e.target.value })}>
                <option value="">Select hospital</option>
                {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Viability window (hours)</label>
              <input type="number" className="input-field" value={form.viabilityHours} onChange={(e) => setForm({ ...form, viabilityHours: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary">Confirm registration</button>
        </motion.form>
      )}

      <div className="space-y-3">
        {organs.map((o, i) => (
          <motion.div
            key={o._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex items-center justify-between p-5"
          >
            <div>
              <p className="font-medium capitalize text-charcoal">{o.organType} · {o.code}</p>
              <p className="text-xs text-stone-400">{o.procurementHospital?.name} — {o.viabilityHours}h viability window</p>
            </div>
            <Badge status={o.status} />
          </motion.div>
        ))}
        {organs.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No organs registered yet.</p>}
      </div>
    </DashboardShell>
  );
}
