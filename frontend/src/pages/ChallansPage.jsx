import { useState, useEffect } from "react";
import { getChallans, createChallan, updateChallanStatus, getAllCustomers, getAllProducts } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { Plus, Search, Eye, FileText, CheckCircle2, XCircle, Download, Trash2, ChevronLeft, ChevronRight, AlertCircle, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ChallansPage() {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "ALL" });
  const [loading, setLoading] = useState(true);

  // Data for selectors
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1 }]);
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");
  const [stockErrors, setStockErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(null);

  const fetchChallans = (page = 1) => {
    setLoading(true);
    getChallans({
      page,
      limit: 10,
      search: filters.search,
      status: filters.status,
    })
      .then((res) => {
        setChallans(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error("Failed to load sales challans"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChallans();
  }, [filters.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchChallans();
  };

  const openCreate = async () => {
    try {
      const [cRes, pRes] = await Promise.all([getAllCustomers(), getAllProducts()]);
      setCustomers(cRes.data.data || []);
      setProducts(pRes.data.data || []);
      setSelectedCustomerId("");
      setItems([{ productId: "", quantity: 1 }]);
      setStatus("Draft");
      setNotes("");
      setStockErrors([]);
      setShowCreateModal(true);
    } catch {
      toast.error("Failed to load dropdown data");
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateChallan = async (e) => {
    e.preventDefault();
    setStockErrors([]);

    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one product with quantity > 0");
      return;
    }

    setSubmitting(true);
    try {
      await createChallan({
        customerId: selectedCustomerId,
        items: validItems,
        status,
        notes,
      });
      toast.success(`Challan created successfully (${status})`);
      setShowCreateModal(false);
      fetchChallans(pagination.page);
    } catch (err) {
      if (err.response?.data?.errors) {
        setStockErrors(err.response.data.errors);
      }
      toast.error(err.response?.data?.message || "Failed to create challan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (challanId, newStatus) => {
    try {
      await updateChallanStatus(challanId, newStatus);
      toast.success(`Challan marked as ${newStatus}`);
      setShowDetailModal(null);
      fetchChallans(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  const generatePDF = (ch) => {
    const doc = new jsPDF();
    const c = ch.customerSnapshot;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199);
    doc.text("INFOTECH ERP", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Mini ERP & CRM Operations Portal", 14, 26);
    doc.text("DELIVERY CHALLAN / DISPATCH NOTE", 140, 20);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 30, 196, 30);

    // Metadata & Customer
    doc.setFontSize(9);
    doc.setTextColor(30);

    doc.setFont("helvetica", "bold");
    doc.text(`Challan #: ${ch.challanNumber}`, 14, 38);
    doc.text(`Date: ${new Date(ch.createdAt).toLocaleDateString()}`, 14, 44);
    doc.text(`Status: ${ch.status.toUpperCase()}`, 14, 50);

    doc.text("CONSIGNEE / CUSTOMER:", 120, 38);
    doc.setFont("helvetica", "normal");
    doc.text(`${c.name} (${c.businessName})`, 120, 44);
    doc.text(`Mobile: ${c.mobile} | Email: ${c.email}`, 120, 50);
    doc.text(`GSTIN: ${c.gstNumber || "N/A"}`, 120, 56);
    doc.text(`Address: ${c.address}`, 120, 62);

    // Items table
    const tableData = ch.items.map((i, idx) => [
      idx + 1,
      i.productName,
      i.sku,
      `₹${i.unitPrice.toLocaleString("en-IN")}`,
      i.quantity,
      `₹${i.totalPrice.toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["#", "Product Description", "SKU Code", "Unit Price", "Qty", "Total Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: "bold" },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Quantity: ${ch.totalQuantity} Units`, 140, finalY);
    doc.text(`Grand Total Amount: INR ${ch.totalAmount.toLocaleString("en-IN")}`, 140, finalY + 6);

    if (ch.notes) {
      doc.setFont("helvetica", "normal");
      doc.text(`Notes: ${ch.notes}`, 14, finalY + 12);
    }

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Authorised Signatory", 150, finalY + 30);
    doc.line(140, finalY + 28, 190, finalY + 28);

    doc.save(`${ch.challanNumber}.pdf`);
    toast.success(`Downloaded ${ch.challanNumber}.pdf`);
  };

  const statusBadge = (s) => {
    const map = { Draft: "badge-warning", Confirmed: "badge-success", Cancelled: "badge-danger" };
    return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Sales Challans</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Dispatch notes, stock reservation, and invoice downloads.</p>
        </div>
        {hasRole("SALES") && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Create Sales Challan
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
              placeholder="Search by Challan # or Customer name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="form-select w-full sm:w-44"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
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
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No sales challans found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer / Firm</th>
                <th>Total Qty</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => (
                <tr key={ch._id}>
                  <td className="font-bold font-mono text-slate-900 dark:text-slate-100">
                    {ch.challanNumber}
                  </td>
                  <td>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{ch.customerSnapshot?.name}</p>
                    <p className="text-xs text-slate-400">{ch.customerSnapshot?.businessName}</p>
                  </td>
                  <td className="font-semibold text-slate-700 dark:text-slate-300">
                    {ch.totalQuantity} Units
                  </td>
                  <td className="font-black text-slate-900 dark:text-slate-100">
                    ₹{ch.totalAmount?.toLocaleString("en-IN")}
                  </td>
                  <td>{statusBadge(ch.status)}</td>
                  <td className="text-xs text-slate-500">
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right space-x-1">
                    <button
                      onClick={() => setShowDetailModal(ch)}
                      className="btn btn-ghost btn-xs"
                      title="View Challan Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => generatePDF(ch)}
                      className="btn btn-ghost btn-xs text-sky-500"
                      title="Download PDF"
                    >
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
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
                onClick={() => fetchChallans(pagination.page - 1)}
                className="btn btn-ghost btn-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchChallans(pagination.page + 1)}
                className="btn btn-ghost btn-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Sales Challan Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Sales Delivery Challan">
        <form onSubmit={handleCreateChallan} className="space-y-4">
          {stockErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5"><AlertCircle size={15} /> Insufficient Inventory Errors:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {stockErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="form-label">Select Consignee Customer *</label>
            <select
              required
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.businessName} ({c.customerType})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Challan Line Items *</label>
              <button type="button" onClick={handleAddItem} className="btn btn-ghost btn-xs text-sky-500">
                <Plus size={14} /> Add Product Row
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <select
                    required
                    className="form-select flex-1 text-xs"
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Available: {p.currentStock}) — ₹{p.unitPrice}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input w-24 text-xs"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Initial Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Draft">Draft (Save without stock impact)</option>
                <option value="Confirmed">Confirmed (Deduct inventory immediately)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Notes / Instructions</label>
              <input className="form-input" placeholder="Delivery notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Saving..." : `Create Challan (${status})`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Challan Detailed Drawer / Modal */}
      {showDetailModal && (
        <Modal isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)} title={`Sales Challan Details — ${showDetailModal.challanNumber}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-400">Customer Consignee:</p>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{showDetailModal.customerSnapshot?.name}</p>
                <p className="text-slate-500">{showDetailModal.customerSnapshot?.businessName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Status:</p>
                {statusBadge(showDetailModal.status)}
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered Line Items</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-center">Unit Price</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {showDetailModal.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{i.productName} <span className="text-slate-400 font-mono">({i.sku})</span></td>
                        <td className="p-2 text-center">₹{i.unitPrice}</td>
                        <td className="p-2 text-center font-bold">{i.quantity}</td>
                        <td className="p-2 text-right font-bold">₹{i.totalPrice?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span>Total Quantity: {showDetailModal.totalQuantity} Units</span>
                <span className="text-sm text-sky-500">Grand Total: ₹{showDetailModal.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Status Change Action Buttons */}
            {hasRole("SALES") && showDetailModal.status !== "Cancelled" && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                {showDetailModal.status === "Draft" && (
                  <button
                    onClick={() => handleStatusChange(showDetailModal._id, "Confirmed")}
                    className="btn btn-success btn-sm"
                  >
                    <CheckCircle2 size={15} /> Confirm & Reserve Stock
                  </button>
                )}
                {showDetailModal.status === "Confirmed" && (
                  <button
                    onClick={() => handleStatusChange(showDetailModal._id, "Cancelled")}
                    className="btn btn-danger btn-sm"
                  >
                    <XCircle size={15} /> Cancel Challan & Restock
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
