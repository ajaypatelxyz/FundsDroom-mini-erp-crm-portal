import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import {
  LayoutDashboard, Users, Package, ArrowRightLeft, FileText,
  LogOut, Shield, ShoppingCart, Warehouse, Calculator, X
} from "lucide-react";

const roleIcons = {
  ADMIN: <Shield size={13} />,
  SALES: <ShoppingCart size={13} />,
  WAREHOUSE: <Warehouse size={13} />,
  ACCOUNTS: <Calculator size={13} />,
};

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: [] },
    { to: "/customers", label: "Customer CRM", icon: <Users size={18} />, roles: ["SALES", "ACCOUNTS"] },
    { to: "/products", label: "Products & Stock", icon: <Package size={18} />, roles: ["WAREHOUSE", "SALES"] },
    { to: "/stock-movements", label: "Inventory Logs", icon: <ArrowRightLeft size={18} />, roles: ["WAREHOUSE"] },
    { to: "/challans", label: "Sales Challans", icon: <FileText size={18} />, roles: ["SALES", "ACCOUNTS"] },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 glass-sidebar flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {links.map((link) => {
            if (link.roles.length > 0 && !hasRole(...link.roles)) return null;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={onCloseMobile}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card Footer */}
        {user && (
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {roleIcons[user.role]} {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn btn-ghost btn-sm justify-center border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-500/30"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
