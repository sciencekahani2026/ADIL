import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Customer } from "../types";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";

export const CustomerManager: React.FC = () => {
  const {
    currentBusiness,
    customers,
    invoices,
    payments,
    saveCustomer,
    deleteCustomer,
    modals,
    openCustomerModal,
    closeCustomerModal,
    openInvoiceDetails,
    openInvoiceEditor,
    t,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const currency = currentBusiness.currency || "USD";

  // Filter customers by customer name, company, email, phone OR by invoice number
  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const matchName = c.name.toLowerCase().includes(q);
    const matchCompany = (c.companyName || "").toLowerCase().includes(q);
    const matchPhone = (c.phone || "").toLowerCase().includes(q);
    const matchEmail = (c.email || "").toLowerCase().includes(q);
    if (matchName || matchCompany || matchPhone || matchEmail) return true;

    // Check if any invoice of this customer matches the invoice number
    const matchInvoice = invoices.some(
      (inv) => inv.customerId === c.id && inv.invoiceNumber.toLowerCase().includes(q)
    );
    return matchInvoice;
  });

  // Get matching invoices for a customer under the current search query
  const getMatchingInvoicesForCustomer = (customerId: string) => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return invoices.filter(
      (inv) => inv.customerId === customerId && inv.invoiceNumber.toLowerCase().includes(q)
    );
  };

  // Calculate customer financial metrics
  const getCustomerMetrics = (customerId: string) => {
    const custInvoices = invoices.filter((i) => i.customerId === customerId);
    let invoiced = 0;
    let paid = 0;
    let balance = 0;

    custInvoices.forEach((inv) => {
      if (inv.status !== "cancelled") {
        const totals = calculateInvoiceTotals(inv, payments);
        invoiced += totals.grandTotal;
        paid += totals.amountPaid;
        balance += totals.remainingBalance;
      }
    });

    return { invoiced, paid, balance, count: custInvoices.length };
  };

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.customers}</h1>
          <p className="text-xs text-slate-500">
            {filteredCustomers.length} active client profiles
          </p>
        </div>
        <button
          onClick={() => openCustomerModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          {t.addCustomer}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="customer-search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by customer name or invoice number..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
        />
        {search && (
          <button
            id="customer-search-clear-btn"
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {search.trim() && (
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span>
            Filtering by customer name or invoice #: <strong className="text-slate-800 font-semibold">"{search}"</strong> ({filteredCustomers.length} found)
          </span>
          <button
            id="customer-clear-filter-text-btn"
            type="button"
            onClick={() => setSearch("")}
            className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">
            {search.trim() ? "No matching customers found" : "No customers found"}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {search.trim()
              ? `No customers matched "${search}". Try searching by a different customer name or invoice number.`
              : "Add your clients to issue invoices and track balances seamlessly."}
          </p>
          {search.trim() ? (
            <button
              id="customer-empty-clear-search-btn"
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => openCustomerModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              {t.addCustomer}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCustomers.map((customer) => {
            const metrics = getCustomerMetrics(customer.id);
            const matchingInvoices = getMatchingInvoicesForCustomer(customer.id);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-3.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{customer.name}</div>
                      {customer.companyName && (
                        <div className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {customer.companyName}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 mt-1">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {customer.email}
                          </span>
                        )}
                      </div>

                      {matchingInvoices.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium">Matched Invoice:</span>
                          {matchingInvoices.map((inv) => (
                            <button
                              key={inv.id}
                              type="button"
                              onClick={() => openInvoiceDetails(inv)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200 transition-colors"
                              title="Click to view invoice details"
                            >
                              <FileText className="w-2.5 h-2.5 text-indigo-500" />
                              {inv.invoiceNumber}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Balance */}
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900">
                      {formatCurrency(metrics.invoiced, currency)}
                    </div>
                    {metrics.balance > 0 ? (
                      <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                        Due: {formatCurrency(metrics.balance, currency)}
                      </div>
                    ) : (
                      <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                        Settled
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400">
                      {metrics.count} {metrics.count === 1 ? "invoice" : "invoices"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      History & Details
                    </button>
                    <button
                      onClick={() => openInvoiceEditor({ customerId: customer.id, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone, customerAddress: customer.address } as any)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                    >
                      + Invoice
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openCustomerModal(customer)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
                          deleteCustomer(customer.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedCustomer.name}</h3>
                {selectedCustomer.companyName && (
                  <p className="text-xs font-bold text-indigo-600">{selectedCustomer.companyName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedCustomer.address}</span>
                </div>
              )}
              {selectedCustomer.taxNumber && (
                <div className="text-[11px] text-slate-500 font-semibold">
                  Tax Number: {selectedCustomer.taxNumber}
                </div>
              )}
              {selectedCustomer.notes && (
                <div className="text-[11px] text-slate-500 italic mt-1">
                  "{selectedCustomer.notes}"
                </div>
              )}
            </div>

            {/* Customer Invoices */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Invoices for this customer
              </div>
              {invoices.filter((i) => i.customerId === selectedCustomer.id).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No invoices yet.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {invoices
                    .filter((i) => i.customerId === selectedCustomer.id)
                    .map((inv) => {
                      const tot = calculateInvoiceTotals(inv, payments);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => {
                            setSelectedCustomer(null);
                            openInvoiceDetails(inv);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-400">{inv.invoiceDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900">
                              {formatCurrency(tot.grandTotal, currency)}
                            </div>
                            <div className={`text-[10px] font-bold ${tot.remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {tot.remainingBalance > 0 ? `Due: ${formatCurrency(tot.remainingBalance, currency)}` : "Paid"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      {modals.customer.open && <CustomerFormModal />}
    </div>
  );
};

const CustomerFormModal: React.FC = () => {
  const { modals, closeCustomerModal, saveCustomer, t } = useApp();
  const customer = modals.customer.customer;
  const isNew = !customer;

  const [name, setName] = useState(customer?.name || "");
  const [companyName, setCompanyName] = useState(customer?.companyName || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [taxNumber, setTaxNumber] = useState(customer?.taxNumber || "");
  const [notes, setNotes] = useState(customer?.notes || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Customer name is required.");
      return;
    }
    saveCustomer({
      id: customer?.id,
      name: name.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      taxNumber: taxNumber.trim(),
      notes: notes.trim(),
    });
    closeCustomerModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            {isNew ? t.addCustomer : "Edit Customer"}
          </h3>
          <button
            onClick={closeCustomerModal}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Johnathan Miller"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, ZIP"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax / VAT Number</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. US-8492019"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Internal Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VIP client, terms..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCustomerModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
