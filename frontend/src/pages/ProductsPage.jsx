import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, adjustStock, getProductCategories } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { Plus, Search, Edit2, ArrowUpRight, ArrowDownRight, Package, AlertTriangle, ChevronLeft, ChevronRight, Layers, Tag, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: "",
  currentStock: 0,
  minStockAlert: 10,
  location: "Warehouse A",
  imageUrl: "",
};

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", category: "ALL", lowStock: false });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockAdjustForm, setStockAdjustForm] = useState({ quantity: 1, movementType: "IN", reason: "" });

  const [saving, setSaving] = useState(false);

  const fetchProducts = (page = 1) => {
    setLoading(true);
    getProducts({
      page,
      limit: 10,
      search: filters.search,
      category: filters.category,
      lowStock: filters.lowStock,
    })
      .then((res) => {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getProductCategories().then((res) => setCategories(res.data.categories || []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.category, filters.lowStock]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location || "Warehouse A",
      imageUrl: p.imageUrl || "",
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing, form);
        toast.success("Product updated");
      } else {
        await createProduct(form);
        toast.success("Product added");
      }
      setShowModal(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    setSaving(true);
    try {
      await adjustStock(stockModalProduct._id, stockAdjustForm);
      toast.success(`Stock adjusted (${stockAdjustForm.movementType} ${stockAdjustForm.quantity})`);
      setStockModalProduct(null);
      setStockAdjustForm({ quantity: 1, movementType: "IN", reason: "" });
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Stock adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Products & Inventory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master product catalog, pricing, and stock adjustments.</p>
        </div>
        {hasRole("WAREHOUSE") && (
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="form-input pl-10 has-icon-left"
              placeholder="Search product name, SKU, or category..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="form-select w-full sm:w-48"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })}
            className={`btn border ${
              filters.lowStock
                ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                : "btn-secondary"
            }`}
          >
            <AlertTriangle size={15} /> Low Stock Only
          </button>

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
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No products found matching filters.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name & SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Storage Location</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p._id}>
                    <td>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                      <p className="text-xs font-mono text-slate-400">SKU: {p.sku}</p>
                    </td>
                    <td>
                      <span className="badge badge-info">{p.category}</span>
                    </td>
                    <td className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{p.unitPrice?.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${isLow ? "text-red-500" : "text-emerald-500"}`}>
                          {p.currentStock} Units
                        </span>
                        {isLow && <span className="badge badge-danger">Low Stock</span>}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {p.location || "Warehouse A"}</span>
                    </td>
                    <td className="text-right space-x-1">
                      {hasRole("WAREHOUSE") && (
                        <>
                          <button
                            onClick={() => {
                              setStockModalProduct(p);
                              setStockAdjustForm({ quantity: 1, movementType: "IN", reason: "Stock replenishment" });
                            }}
                            className="btn btn-ghost btn-xs text-sky-500"
                            title="Adjust Stock"
                          >
                            <ArrowUpRight size={14} /> Stock +/-
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="btn btn-ghost btn-xs"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
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
                onClick={() => fetchProducts(pagination.page - 1)}
                className="btn btn-ghost btn-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProducts(pagination.page + 1)}
                className="btn btn-ghost btn-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Product" : "Add New Product"}>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Product Name *</label>
              <input required className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Router AC1200" />
            </div>
            <div>
              <label className="form-label">SKU Code *</label>
              <input required className="form-input uppercase font-mono" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-NET-001" disabled={!!editing} />
            </div>
            <div>
              <label className="form-label">Category *</label>
              <input required className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Networking, Hardware, etc." />
            </div>
            <div>
              <label className="form-label">Unit Price (₹) *</label>
              <input type="number" min="0" step="0.01" required className="form-input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="1499.00" />
            </div>
            {!editing && (
              <div>
                <label className="form-label">Initial Stock Quantity</label>
                <input type="number" min="0" className="form-input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} />
              </div>
            )}
            <div>
              <label className="form-label">Min Stock Alert Threshold</label>
              <input type="number" min="0" className="form-input" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })} />
            </div>
            <div>
              <label className="form-label">Warehouse Location</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Warehouse A, Rack 4" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjust Modal */}
      {stockModalProduct && (
        <Modal isOpen={!!stockModalProduct} onClose={() => setStockModalProduct(null)} title={`Manual Stock Adjustment — ${stockModalProduct.name}`}>
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <p><span className="text-slate-400">Current Stock:</span> <span className="font-black text-sky-500">{stockModalProduct.currentStock} Units</span></p>
              <p><span className="text-slate-400">SKU:</span> <span className="font-mono">{stockModalProduct.sku}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Movement Type</label>
                <select className="form-select" value={stockAdjustForm.movementType} onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, movementType: e.target.value })}>
                  <option value="IN">IN (+) Add Stock</option>
                  <option value="OUT">OUT (-) Remove Stock</option>
                </select>
              </div>
              <div>
                <label className="form-label">Quantity</label>
                <input type="number" min="1" required className="form-input" value={stockAdjustForm.quantity} onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, quantity: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="form-label">Reason / Reference *</label>
              <input required className="form-input" placeholder="e.g. Stock audit clearance, damaged goods..." value={stockAdjustForm.reason} onChange={(e) => setStockAdjustForm({ ...stockAdjustForm, reason: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setStockModalProduct(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className={stockAdjustForm.movementType === "IN" ? "btn btn-success" : "btn btn-danger"}>
                {saving ? "Adjusting..." : `Confirm ${stockAdjustForm.movementType} ${stockAdjustForm.quantity} Units`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
