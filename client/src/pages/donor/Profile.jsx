import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/donor/dashboard", label: "Overview", end: true },
  { to: "/donor/profile", label: "Profile" },
  { to: "/donor/organs", label: "Organs" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorProfile() {
  const [form, setForm] = useState({
    bloodGroup: "O+",
    dateOfBirth: "",
    height_cm: "",
    weight_kg: "",
    medicalHistory: "",
    isDeceasedDonor: false,
  });
  const [donor, setDonor] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/donor/profile");
      if (data.donor) {
        setDonor(data.donor);
        setForm((f) => ({
          ...f,
          ...data.donor,
          dateOfBirth: data.donor.dateOfBirth ? data.donor.dateOfBirth.slice(0, 10) : "",
          registeredHospital: data.donor.registeredHospital?._id,
        }));
      }
      try {
        const { data: h } = await api.get("/admin/hospitals");
        setHospitals(h.hospitals || []);
      } catch {
        setHospitals([]);
      }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.put("/donor/profile", form);
      setDonor(data.donor);
      setMessage("Profile saved.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const toggleConsent = async () => {
    const { data } = await api.post("/donor/consent", { consentGiven: !donor?.consentGiven });
    setDonor(data.donor);
  };

  return (
    <DashboardShell title="Donor profile" subtitle="Donor" tabs={TABS}>
      <div className="grid gap-6 md:grid-cols-3">
        <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 p-6 md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Blood group</label>
              <select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Date of birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Height (cm)</label>
              <input type="number" className="input-field" value={form.height_cm || ""} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Weight (kg)</label>
              <input type="number" className="input-field" value={form.weight_kg || ""} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Registered hospital</label>
            <select
              className="input-field"
              value={form.registeredHospital || ""}
              onChange={(e) => setForm({ ...form, registeredHospital: e.target.value })}
            >
              <option value="">Select a hospital</option>
              {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name} — {h.city}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Relevant medical history</label>
            <textarea
              rows={4}
              className="input-field"
              value={form.medicalHistory || ""}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              placeholder="Any conditions your care team should know about..."
            />
          </div>
          {message && <p className="text-xs text-forest-700">{message}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save profile"}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <ShieldCheck size={20} className="text-forest-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-charcoal">Consent</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            Consent is required before any organ you register can be analyzed or matched. You can withdraw consent
            at any time.
          </p>
          <button
            onClick={toggleConsent}
            disabled={!donor}
            className={`mt-4 w-full rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              donor?.consentGiven
                ? "border border-stone-300 text-stone-600 hover:border-rose-400 hover:text-rose-600"
                : "bg-forest-700 text-warmwhite hover:bg-forest-800"
            }`}
          >
            {!donor ? "Save profile first" : donor.consentGiven ? "Withdraw consent" : "Give consent"}
          </button>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
