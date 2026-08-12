import { useState, useEffect } from "react";
import { getDashboard } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Users, Package, FileText, TrendingUp, AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">Failed to load dashboard statistics.</p>;
  const { stats, lowStockItems, recentMovements, recentChallans } = data;

  const cards = [
    {
      label: "Total Customers",
      value: stats.customers.total,
      sub: `${stats.customers.active} Active · ${stats.customers.leads} Leads`,
      icon: <Users size={24} />,
      gradient: "from-blue-500 to-cyan-500",
      accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Products",
      value: stats.products.total,
      sub: `${stats.products.lowStock} Low Stock Alert`,
      icon: <Package size={24} />,
      gradient: "from-purple-500 to-indigo-500",
      accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      label: "Sales Challans",
      value: stats.challans.total,
      sub: `${stats.challans.confirmed} Confirmed · ${stats.challans.draft} Draft`,
      icon: <FileText size={24} />,
      gradient: "from-amber-500 to-orange-500",
      accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      sub: "From Confirmed Challans",
      icon: <TrendingUp size={24} />,
      gradient: "from-emerald-500 to-teal-500",
      accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  const statusBadge = (s) => {
    const map = { Draft: "badge-warning", Confirmed: "badge-success", Cancelled: "badge-danger" };
    return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name || "User"} 👋
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Here is your operational snapshot for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} /> Live System Active
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="stat-card group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {c.label}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-left">
                  {c.value}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{c.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${c.accentBg} flex items-center justify-center shadow-sm`}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Low Stock + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertTriangle size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Low Stock Alerts</h2>
              </div>
              {lowStockItems.length > 0 && (
                <span className="badge badge-danger">{lowStockItems.length} Items</span>
              )}
            </div>

            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ All stock levels are healthy
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="text-xs text-slate-500">SKU: {p.sku} · {p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${p.currentStock <= 5 ? "text-red-500" : "text-amber-500"}`}>
                        {p.currentStock} Units
                      </p>
                      <p className="text-[0.7rem] text-slate-400">Threshold: {p.minStockAlert}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Challans */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                  <FileText size={18} />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Sales Challans</h2>
              </div>
            </div>

            {recentChallans.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No challans created yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentChallans.map((ch) => (
                  <div
                    key={ch._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{ch.challanNumber}</p>
                      <p className="text-xs text-slate-500">{ch.customerSnapshot?.name}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          ₹{ch.totalAmount?.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[0.7rem] text-slate-400">
                          {new Date(ch.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {statusBadge(ch.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
