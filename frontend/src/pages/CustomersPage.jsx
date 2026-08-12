import { useState, useEffect } from "react";
import { getCustomers, createCustomer, updateCustomer, addCustomerNote } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { Plus, Search, Eye, Edit2, MessageSquarePlus, ChevronLeft, ChevronRight, User, Phone, Mail, Building, FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "Wholesale",
  address: "",
  status: "Lead",
  followUpDate: "",
  notes: "",
};

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "ALL", customerType: "ALL" });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomers = (page = 1) => {
    setLoading(true);
    getCustomers({
      page,
      limit: 10,
      search: filters.search,
      status: filters.status,
      customerType: filters.customerType,
    })
      .then((res) => {
        setCustomers(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [filters.status, filters.customerType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || "",
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.split("T")[0] : "",
      notes: c.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateCustomer(editing, form);
        toast.success("Customer profile updated");
      } else {
        await createCustomer(form);
        toast.success("New customer registered");
      }
      setShowModal(false);
      fetchCustomers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !showDetail) return;
    try {
      const res = await addCustomerNote(showDetail._id, noteText);
      setShowDetail({ ...showDetail, followUpNotes: res.data.followUpNotes });
      setNoteText("");
      toast.success("Follow-up note logged");
    } catch (err) {
      toast.error("Failed to add follow-up note");
    }
  };

  const statusBadge = (s) => {
    const map = { Active: "badge-success", Lead: "badge-warning", Inactive: "badge-neutral" };
    return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
  };

  const typeBadge = (t) => {
    const map = { Wholesale: "badge-info", Retail: "badge-purple", Distributor: "badge-success" };
    return <span className={`badge ${map[t] || "badge-neutral"}`}>{t}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Customer CRM</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage client accounts, leads, and sales follow-up notes.</p>
        </div>
        {hasRole("SALES") && (
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Register Customer
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
              placeholder="Search by name, business, email, or mobile..."
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
            <option value="Active">Active</option>
            <option value="Lead">Lead</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            className="form-select w-full sm:w-44"
            value={filters.customerType}
            onChange={(e) => setFilters({ ...filters, customerType: e.target.value })}
          >
            <option value="ALL">All Types</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Retail">Retail</option>
            <option value="Distributor">Distributor</option>
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
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customers found matching your criteria.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Business</th>
                <th>Contact Info</th>
                <th>Type</th>
                <th>Status</th>
                <th>GST Number</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building size={12} /> {c.businessName}
                    </p>
                  </td>
                  <td>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {c.mobile}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" /> {c.email}
                    </p>
                  </td>
                  <td>{typeBadge(c.customerType)}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td className="font-mono text-xs text-slate-500">{c.gstNumber || "N/A"}</td>
                  <td className="text-right space-x-1">
                    <button
                      onClick={() => setShowDetail(c)}
                      className="btn btn-ghost btn-xs"
                      title="View Details & Notes"
                    >
                      <Eye size={14} />
                    </button>
                    {hasRole("SALES") && (
                      <button
                        onClick={() => openEdit(c)}
                        className="btn btn-ghost btn-xs"
                        title="Edit Customer"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
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
                onClick={() => fetchCustomers(pagination.page - 1)}
                className="btn btn-ghost btn-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1)}
                className="btn btn-ghost btn-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Customer Profile" : "Register New Customer"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Name *</label>
              <input required className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
            </div>
            <div>
              <label className="form-label">Business / Firm Name *</label>
              <input required className="form-input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Company Ltd" />
            </div>
            <div>
              <label className="form-label">Mobile Number *</label>
              <input required className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="form-label">Email Address *</label>
              <input type="email" required className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@company.com" />
            </div>
            <div>
              <label className="form-label">Customer Type</label>
              <select className="form-select" value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                <option value="Wholesale">Wholesale</option>
                <option value="Retail">Retail</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            <div>
              <label className="form-label">Lead Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="form-label">GSTIN Number</label>
              <input className="form-input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="form-label">Next Follow-Up Date</label>
              <input type="date" className="form-input" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">Billing & Delivery Address *</label>
            <textarea required rows={2} className="form-textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, State, PIN" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : editing ? "Update Customer" : "Create Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Drawer / Modal */}
      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`Customer Details — ${showDetail.name}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div><span className="text-slate-400">Business:</span> <span className="font-bold">{showDetail.businessName}</span></div>
              <div><span className="text-slate-400">Mobile:</span> <span className="font-bold">{showDetail.mobile}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="font-bold">{showDetail.email}</span></div>
              <div><span className="text-slate-400">GSTIN:</span> <span className="font-bold">{showDetail.gstNumber || "N/A"}</span></div>
              <div className="col-span-2"><span className="text-slate-400">Address:</span> <span className="font-bold">{showDetail.address}</span></div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText size={14} /> Follow-Up Activity Logs
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(showDetail.followUpNotes || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                ) : (
                  showDetail.followUpNotes.map((n, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                      <p className="text-slate-800 dark:text-slate-200">{n.note}</p>
                      <p className="text-[0.65rem] text-slate-400 mt-1">By {n.createdBy} on {new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Log new note */}
            {hasRole("SALES") && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  className="form-input flex-1 text-xs"
                  placeholder="Type follow-up note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button onClick={handleAddNote} className="btn btn-primary btn-sm">
                  <MessageSquarePlus size={14} /> Add Note
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
