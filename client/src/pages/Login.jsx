import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = ["donor", "recipient", "hospital", "admin"];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("recipient");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const { data } = await api.post("/auth/google", { credential: response.credential, roleHint: role });
          login(data.token, data.user);
          navigate(`/${data.user.role}/dashboard`);
        } catch (err) {
          setError(err.response?.data?.error || "Google sign-in failed");
        }
      },
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320,
      });
    }
  }, [role]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : { ...form, role };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate(`/${data.user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warmwhite px-6 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to access your Organis dashboard.</p>
        </div>

        <div className="card p-8">
          {GOOGLE_CLIENT_ID ? (
            <div className="mb-6 flex justify-center">
              <div ref={googleBtnRef} />
            </div>
          ) : (
            <div className="mb-6 rounded-lg bg-stone-50 p-3 text-center text-xs text-stone-500">
              Google sign-in isn't configured in this environment. Use email/password below (demo mode).
            </div>
          )}

          <div className="mb-6 flex items-center gap-3 text-xs text-stone-400">
            <div className="h-px flex-1 bg-stone-200" />
            or continue with email
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <input
                required
                placeholder="Full name"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
            <input
              required
              type="email"
              placeholder="Email address"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {mode === "register" && (
              <div>
                <p className="mb-2 text-xs font-medium text-stone-500">I am registering as a</p>
                <div className="grid grid-cols-4 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-lg border px-2 py-2 text-xs capitalize transition-colors ${
                        role === r ? "border-forest-600 bg-forest-50 text-forest-700" : "border-stone-200 text-stone-500"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-500">
            {mode === "login" ? "New to Organis?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-forest-700 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-stone-400">
          Demo credentials (after seeding): any <code>@organis.demo</code> address, password <code>Demo@1234</code>
        </p>
      </motion.div>
    </div>
  );
}
