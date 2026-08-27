import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  if (user) {
    return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuggestions([]);

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
      if (err.suggestions && err.suggestions.length > 0) {
        setSuggestions(err.suggestions);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectSuggestion(sug) {
    setForm((current) => ({ ...current, username: sug }));
    setSuggestions([]);
    setError("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-forge-900/70 to-slate-900/90 p-8 shadow-ember">
          <p className="text-sm uppercase tracking-[0.32em] text-forge-200">FocusForge</p>
          <h1 className="mt-6 max-w-lg font-display text-5xl leading-tight text-white">
            Measure effort, not intention.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            A productivity system built around focused time, streaks, session recovery, and measurable growth.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["2 XP", "per focused minute"],
              ["60 min", "to protect your streak"],
              ["90 min", "marks deep work"],
            ].map(([value, label]) => (
              <div key={value} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
          <h2 className="font-display text-3xl text-white">{isLogin ? "Welcome back" : "Create account"}</h2>
          <p className="mt-3 text-sm text-slate-400">
            {isLogin ? "Resume your focus streak." : "Start building the MVP habit loop."}
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Username</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0 transition focus:border-forge-400"
                  value={form.username}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, username: event.target.value }));
                    if (suggestions.length > 0) setSuggestions([]);
                  }}
                  required
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>

            {error ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-rose-400">{error}</p>

                {suggestions.length > 0 && (
                  <div className="rounded-2xl border border-forge-500/30 bg-forge-500/10 p-4 space-y-2 animate-fadeIn">
                    <p className="text-xs font-semibold uppercase tracking-wider text-forge-300">
                      Suggested usernames for you:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          className="rounded-xl border border-forge-400/30 bg-forge-500/20 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-forge-300 hover:bg-forge-500/40 hover:scale-105 active:scale-95"
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Click any suggested username above to apply it instantly.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white transition hover:bg-forge-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Please wait..." : isLogin ? "Login" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-400">
            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
            <Link className="text-forge-300 hover:text-forge-200" to={isLogin ? "/register" : "/login"}>
              {isLogin ? "Register" : "Login"}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
