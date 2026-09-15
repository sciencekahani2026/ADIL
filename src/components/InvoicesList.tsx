import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  FileDown,
  Share2,
  MoreVertical,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  Trash2,
  Eye,
  Printer,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";
import { downloadInvoicePdf } from "../utils/pdfGenerator";
import { InvoiceStatus } from "../types";

export const InvoicesList: React.FC = () => {
  const {
    currentBusiness,
    invoices,
    payments,
    t,
    openInvoiceEditor,
    openInvoiceDetails,
    openShareModal,
    openPrinterModal,
    deleteInvoice,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  const currency = currentBusiness.currency || "USD";

  const statusTabs: { key: string; label: string }[] = [
    { key: "all", label: t.all },
    { key: "draft", label: t.draft },
    { key: "sent", label: t.sent },
    { key: "partially_paid", label: t.partiallyPaid },
    { key: "paid", label: t.paid },
    { key: "overdue", label: t.overdue },
    { key: "cancelled", label: t.cancelled },
  ];

  // Filter & Search
  const filteredInvoices = invoices.filter((inv) => {
    const totals = calculateInvoiceTotals(inv, payments);
    if (statusFilter !== "all" && totals.effectiveStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = inv.customerName.toLowerCase().includes(q);
      const matchEmail = (inv.customerEmail || "").toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchEmail) return false;
    }
    return true;
  });

  // Sort
  filteredInvoices.sort((a, b) => {
    const totalsA = calculateInvoiceTotals(a, payments);
    const totalsB = calculateInvoiceTotals(b, payments);

    if (sortBy === "date_desc") {
      return b.invoiceDate.localeCompare(a.invoiceDate);
    }
    if (sortBy === "date_asc") {
      return a.invoiceDate.localeCompare(b.invoiceDate);
    }
    if (sortBy === "amount_desc") {
      return totalsB.grandTotal - totalsA.grandTotal;
    }
    if (sortBy === "amount_asc") {
      return totalsA.grandTotal - totalsB.grandTotal;
    }
    return 0;
  });

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partially_paid: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    viewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.invoices}</h1>
          <p className="text-xs text-slate-500">
            {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>
        <button
          onClick={() => openInvoiceEditor()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          {t.newInvoice}
        </button>
      </div>

      {/* Search Bar & Sort */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="invoices-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by customer name or invoice number..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
          {search && (
            <button
              id="invoices-search-clear-btn"
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          id="invoices-sort-select"
          value={sortBy}
          onChange={(e: any) => setSortBy(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="amount_desc">Amount (High to Low)</option>
          <option value="amount_asc">Amount (Low to High)</option>
        </select>
      </div>

      {search.trim() && (
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span>
            Filtering by customer name or invoice #: <strong className="text-slate-800 font-semibold">"{search}"</strong> ({filteredInvoices.length} found)
          </span>
          <button
            id="invoices-clear-filter-text-btn"
            type="button"
            onClick={() => setSearch("")}
            className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Horizontal Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {statusTabs.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Invoice List Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">
            {search.trim() ? "No matching invoices found" : "No invoices found"}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {search.trim()
              ? `No invoices matched "${search}". Try searching by a different customer name or invoice number.`
              : "Try adjusting your search query or status filter, or create a brand new invoice."}
          </p>
          {search.trim() ? (
            <button
              id="invoices-empty-clear-search-btn"
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => openInvoiceEditor()}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.createInvoice}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInvoices.map((inv) => {
            const totals = calculateInvoiceTotals(inv, payments);
            const statusClass = statusStyles[totals.effectiveStatus] || "bg-slate-100 text-slate-700";

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow p-3.5 group"
              >
                {/* Header row: Number, Status & Customer */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{inv.invoiceNumber}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusClass}`}>
                        {totals.effectiveStatus.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-1 truncate">
                      {inv.customerName}
                    </div>
                    {inv.customerEmail && (
                      <div className="text-[10px] text-slate-400 truncate">{inv.customerEmail}</div>
                    )}
                  </div>

                  {/* Financial amount */}
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(totals.grandTotal, currency)}
                    </div>
                    {totals.remainingBalance > 0 && totals.amountPaid > 0 ? (
                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                        Due: {formatCurrency(totals.remainingBalance, currency)}
                      </div>
                    ) : totals.remainingBalance === 0 ? (
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Paid in full
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Unpaid
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates & Line count */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Issued {inv.invoiceDate}</span>
                    <span className="text-slate-300">•</span>
                    <span className={totals.isOverdue ? "text-rose-600 font-bold" : ""}>
                      Due {inv.dueDate || "Receipt"}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    {inv.items.length} {inv.items.length === 1 ? "item" : "items"}
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-3 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openInvoiceDetails(inv)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => downloadInvoicePdf(inv, currentBusiness, payments)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="Download PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openPrinterModal(inv)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                      title="Print via Bluetooth or Hotspot Wi-Fi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openShareModal(inv)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="Share (WhatsApp, Email, Native Sheet)"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openInvoiceEditor(inv)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                          deleteInvoice(inv.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Invoice"
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
    </div>
  );
};
