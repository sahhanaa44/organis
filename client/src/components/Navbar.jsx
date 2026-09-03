import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-stone-200/70 bg-warmwhite/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="container-editorial flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-xl tracking-tight text-ink">Organis</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/#how-it-works" className="link-underline text-sm text-stone-600 hover:text-charcoal">
            How it works
          </Link>
          <Link to="/#transparency" className="link-underline text-sm text-stone-600 hover:text-charcoal">
            Transparency
          </Link>
          <Link to="/assistant" className="link-underline text-sm text-stone-600 hover:text-charcoal">
            Assistant
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <button
                onClick={() => navigate(`/${user.role}/dashboard`)}
                className="hidden text-sm font-medium text-charcoal sm:inline hover:text-forest-700"
              >
                Dashboard
              </button>
              <button onClick={logout} className="btn-secondary !px-4 !py-2 text-xs">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-medium text-charcoal sm:inline hover:text-forest-700">
                Sign in
              </Link>
              <Link to="/login" className="btn-primary !px-5 !py-2.5 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
