import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NavLinkItem } from "../components/NavLinkItem";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <aside className="w-full rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 lg:sticky lg:top-6 lg:w-72 lg:self-start">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-forge-300">FocusForge</p>
          <h1 className="mt-3 font-display text-4xl text-white">Build visible discipline.</h1>
          <p className="mt-3 text-sm text-slate-400">{user?.username}</p>
        </div>
        <nav className="flex flex-col gap-2">
          <NavLinkItem to="/">Dashboard</NavLinkItem>
          <NavLinkItem to="/tasks">Tasks</NavLinkItem>
          <NavLinkItem to="/focus">Focus</NavLinkItem>
          <NavLinkItem to="/analytics">Analytics</NavLinkItem>
          <NavLinkItem to="/leaderboard">Leaderboard</NavLinkItem>
          <NavLinkItem to="/settings">Settings</NavLinkItem>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-8 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-forge-400 hover:text-white"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
