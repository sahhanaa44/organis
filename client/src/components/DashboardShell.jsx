import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "./NotificationBell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardShell({ title, subtitle, tabs, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-warmwhite pt-20">
      <div className="border-b border-stone-200 bg-white/70 backdrop-blur-sm">
        <div className="container-editorial flex items-center justify-between py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-forest-600">{subtitle}</p>
            <h1 className="mt-1 text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-charcoal">{user?.name}</p>
              <p className="text-xs capitalize text-stone-400">{user?.role}</p>
            </div>
            <button onClick={logout} className="btn-secondary !px-4 !py-2 text-xs">
              Sign out
            </button>
          </div>
        </div>
        {tabs && (
          <div className="container-editorial flex gap-6 overflow-x-auto pb-3">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 pb-2 text-sm transition-colors ${
                    isActive ? "border-forest-600 text-forest-700 font-medium" : "border-transparent text-stone-500 hover:text-charcoal"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="container-editorial py-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
