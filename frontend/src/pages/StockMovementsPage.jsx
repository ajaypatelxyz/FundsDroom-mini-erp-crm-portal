import { useState, useEffect } from "react";
import { getStockMovements } from "../services/api";
import { Search, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, History } from "lucide-react";
import toast from "react-hot-toast";

export default function StockMovementsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", movementType: "ALL" });
  const [loading, setLoading] = useState(true);

  const fetchLogs = (page = 1) => {
    setLoading(true);
    getStockMovements({
      page,
      limit: 10,
      search: filters.search,
      movementType: filters.movementType,
    })
      .then((res) => {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error("Failed to load inventory logs"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.movementType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Inventory Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Immutable ledger of all IN and OUT stock transactions.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="form-input pl-10 has-icon-left"
              placeholder="Search product name, SKU, or reason..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="form-select w-full sm:w-44"
            value={filters.movementType}
            onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
          >
            <option value="ALL">All Movements</option>
            <option value="IN">IN (+ Stock Entry)</option>
            <option value="OUT">OUT (- Dispatch)</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="glass-panel data-table-container">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No stock movement logs recorded.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product Name & SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isIn = log.movementType === "IN";
                return (
                  <tr key={log._id}>
                    <td className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{log.productName}</p>
                      <p className="text-xs font-mono text-slate-400">SKU: {log.sku}</p>
                    </td>
                    <td>
                      <span className={`badge ${isIn ? "badge-success" : "badge-danger"}`}>
                        {isIn ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                        {log.movementType}
                      </span>
                    </td>
                    <td className="font-black text-sm text-slate-900 dark:text-slate-100">
                      {isIn ? `+${log.quantity}` : `-${log.quantity}`} Units
                    </td>
                    <td className="text-xs text-slate-600 dark:text-slate-300">
                      {log.reason}
                    </td>
                    <td className="text-xs font-medium text-slate-500">
                      {log.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="btn btn-ghost btn-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="btn btn-ghost btn-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
