import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";
import { Sun, Moon, ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.data.success) {
        loginUser(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success(`Credentials loaded for ${demoEmail.split("@")[0].toUpperCase()}`);
  };

  const demos = [
    { role: "Admin", email: "admin@erp.com", color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-600 dark:text-purple-300" },
    { role: "Sales", email: "sales@erp.com", color: "from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-600 dark:text-sky-300" },
    { role: "Warehouse", email: "warehouse@erp.com", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300" },
    { role: "Accounts", email: "accounts@erp.com", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-300" },
  ];

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Top right Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:scale-105 transition-all duration-200"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-sky-600" />}
        </button>
      </div>

      {/* Main Login Glass Card */}
      <div className="w-full max-w-md glass-panel p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sign in to access your wholesale operations portal
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={14} className="text-sky-500" />
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Demo Logins
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demos.map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => fillDemo(d.email, "password123")}
                className={`px-3 py-2 rounded-xl text-xs font-bold border bg-gradient-to-r ${d.color} hover:scale-[1.02] transition-transform flex items-center justify-between`}
              >
                <span>{d.role}</span>
                <ShieldCheck size={14} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@erp.com"
                className="form-input pl-10 has-icon-left"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input pl-10 pr-10 has-icon-left has-icon-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 rounded-xl font-bold mt-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In to Portal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
