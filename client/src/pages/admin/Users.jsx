import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import DashboardShell from "../../components/DashboardShell.jsx";
import Badge from "../../components/Badge.jsx";
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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/users", { params: { q, role } });
    setUsers(data.users || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const toggleActive = async (u) => {
    const { data } = await api.put(`/admin/users/${u._id}`, { isActive: !u.isActive });
    setUsers((list) => list.map((x) => (x._id === u._id ? data.user : x)));
  };

  return (
    <DashboardShell title="Users" subtitle="Admin" tabs={TABS}>
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input-field pl-9" placeholder="Search name or email..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <select className="input-field w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {["donor", "recipient", "hospital", "admin"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-stone-50 last:border-0">
                <td className="px-5 py-3.5 font-medium text-charcoal">{u.name}</td>
                <td className="px-5 py-3.5 text-stone-600">{u.email}</td>
                <td className="px-5 py-3.5 capitalize text-stone-600">{u.role}</td>
                <td className="px-5 py-3.5"><Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Disabled"}</Badge></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => toggleActive(u)} className="text-xs text-forest-600 hover:underline">
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="py-10 text-center text-sm text-stone-400">No users found.</p>}
      </div>
    </DashboardShell>
  );
}
