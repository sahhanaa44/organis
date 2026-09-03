import React, { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../lib/api.js";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const unread = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      load();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-stone-100"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-forest-600">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500 opacity-75" />
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <p className="text-sm font-medium text-charcoal">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-forest-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-stone-400">You're all caught up.</p>}
              {items.slice(0, 8).map((n) => (
                <div key={n._id} className={`border-b border-stone-50 px-4 py-3 last:border-0 ${!n.isRead ? "bg-sage-50/50" : ""}`}>
                  <p className="text-sm font-medium text-charcoal">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{n.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
