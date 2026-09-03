import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/DashboardShell.jsx";
import api from "../../lib/api.js";

const TABS = [
  { to: "/recipient/dashboard", label: "Overview", end: true },
  { to: "/recipient/profile", label: "Profile" },
  { to: "/recipient/waitlist", label: "Waitlist" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ORGAN_TYPES = ["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"];
const URGENCY = ["low", "medium", "high", "critical"];

export default function RecipientProfile() {
  const [form, setForm] = useState({
    bloodGroup: "O+",
    requiredOrgan: "kidney",
    urgency: "medium",
    dateOfBirth: "",
    height_cm: "",
    weight_kg: "",
    hospital: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/recipient/profile");
        if (data.recipient) {
          setForm((f) => ({
            ...f,
            ...data.recipient,
            dateOfBirth: data.recipient.dateOfBirth ? data.recipient.dateOfBirth.slice(0, 10) : "",
            hospital: data.recipient.hospital?._id,
          }));
        }
      } catch {
        /* no profile yet */
      }
      try {
        const { data: h } = await api.get("/hospital");
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
      await api.put("/recipient/profile", form);
      setMessage("Profile saved. You're on the waiting list.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Recipient profile" subtitle="Recipient" tabs={TABS}>
      <motion.form onSubmit={save} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-2xl space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Blood group</label>
            <select className="input-field" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Required organ</label>
            <select className="input-field" value={form.requiredOrgan} onChange={(e) => setForm({ ...form, requiredOrgan: e.target.value })}>
              {ORGAN_TYPES.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Urgency</label>
            <select className="input-field" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
              {URGENCY.map((u) => <option key={u} value={u}>{u}</option>)}
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
          <label className="mb-1 block text-xs text-stone-500">Hospital</label>
          <select className="input-field" value={form.hospital || ""} onChange={(e) => setForm({ ...form, hospital: e.target.value })}>
            <option value="">Select a hospital</option>
            {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name} — {h.city}</option>)}
          </select>
        </div>
        {message && <p className="text-xs text-forest-700">{message}</p>}
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save profile"}</button>
      </motion.form>
    </DashboardShell>
  );
}
