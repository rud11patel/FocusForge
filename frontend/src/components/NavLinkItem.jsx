import { NavLink } from "react-router-dom";

export function NavLinkItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive ? "bg-forge-500 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
