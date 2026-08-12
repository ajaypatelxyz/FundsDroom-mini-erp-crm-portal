import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Shield, ShoppingCart, Warehouse, Calculator, LogOut, Menu, User as UserIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const roleIcons = {
  ADMIN: <Shield size={13} />,
  SALES: <ShoppingCart size={13} />,
  WAREHOUSE: <Warehouse size={13} />,
  ACCOUNTS: <Calculator size={13} />,
};

const pageTitles = {
  "/": "Dashboard Overview",
  "/customers": "Customer CRM Management",
  "/products": "Products & Stock Master",
  "/stock-movements": "Inventory Audit Logs",
  "/challans": "Sales Challans Operations",
};

export default function Header({ onMobileMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const title = pageTitles[location.pathname] || "InfoTech ERP";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 glass-header px-4 lg:px-8 py-3 flex items-center justify-between transition-colors">
      {/* Left side: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-500/10 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Theme Switcher + Role Pill + User Info */}
      <div className="flex items-center gap-3">
        {/* Light/Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 border border-slate-300/50 dark:border-slate-700/60 shadow-sm transition-all duration-300 group"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-400 transform group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-sky-600 transform group-hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Pill & Quick Logout */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-sky-500/20">
              {user.name?.[0]?.toUpperCase() || <UserIcon size={14} />}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {roleIcons[user.role]} {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
