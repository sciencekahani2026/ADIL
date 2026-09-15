import React, { useState } from "react";
import {
  CreditCard,
  Search,
  Plus,
  Receipt,
  FileDown,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  DollarSign,
  Printer,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Payment, PaymentMethod, Invoice } from "../types";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";
import { downloadReceiptPdf } from "../utils/receiptPdfGenerator";

export const PaymentManager: React.FC = () => {
  const {
    currentBusiness,
    payments,
    invoices,
    deletePayment,
    modals,
    openPaymentModal,
    closePaymentModal,
    openPrinterModal,
    t,
  } = useApp();

  const [search, setSearch] = useState("");
  const currency = currentBusiness.currency || "USD";

  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const filteredPayments = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      p.invoiceNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      (p.referenceNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header & Total Collected Card */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.payments}</h1>
          <p className="text-xs text-slate-500">{payments.length} transactions recorded</p>
        </div>
        <button
          onClick={() => openPaymentModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          {t.recordPayment}
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
            Total Collections
          </span>
          <div className="text-2xl font-black mt-0.5">
            {formatCurrency(totalCollected, currency)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by receipt #, invoice #, customer, or reference..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
        />
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">No payment records found</div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Record payments against open customer invoices to maintain accurate balances.
          </p>
          <button
            onClick={() => openPaymentModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            {t.recordPayment}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPayments.map((p) => {
            const relatedInvoice = invoices.find((i) => i.id === p.invoiceId);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{p.receiptNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-700 mt-1">
                      {p.customerName || "Customer"}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Inv #{p.invoiceNumber}</span>
                      <span>•</span>
                      <span>{p.date}</span>
                      {p.referenceNumber && (
                        <>
                          <span>•</span>
                          <span>Ref: {p.referenceNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">
                      +{formatCurrency(p.amount, currency)}
                    </div>
                  </div>
                </div>

                {p.notes && (
                  <div className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">
                    "{p.notes}"
                  </div>
                )}

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const inv: Invoice = relatedInvoice || {
                        id: p.invoiceId,
                        businessId: currentBusiness.id,
                        invoiceNumber: p.invoiceNumber,
                        invoiceDate: p.date,
                        dueDate: p.date,
                        customerId: p.customerId,
                        customerName: p.customerName,
                        customerEmail: "",
                        customerPhone: "",
                        customerAddress: "",
                        items: [],
                        discountType: "percentage",
                        discountValue: 0,
                        shipping: 0,
                        additionalCharges: 0,
                        taxType: "exclusive",
                        notes: "",
                        terms: "",
                        paymentInstructions: "",
                        template: "modern",
                        status: "paid",
                        createdAt: p.createdAt,
                        updatedAt: p.createdAt,
                      };
                      downloadReceiptPdf(p, inv, currentBusiness, payments);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Receipt PDF
                  </button>

                  <button
                    onClick={() => {
                      const inv = invoices.find((i) => i.id === p.invoiceId) || {
                        id: p.invoiceId,
                        businessId: currentBusiness.id,
                        invoiceNumber: `INV-${p.invoiceId.slice(0, 6)}`,
                        invoiceDate: p.date,
                        dueDate: p.date,
                        customerId: "",
                        customerName: "Customer",
                        customerEmail: "",
                        customerPhone: "",
                        customerAddress: "",
                        items: [{ id: "1", name: "Payment Received", quantity: 1, unitPrice: p.amount }],
                        discountType: "fixed",
                        discountValue: 0,
                        shipping: 0,
                        additionalCharges: 0,
                        taxType: "exclusive",
                        notes: p.notes || "",
                        terms: "",
                        paymentInstructions: "",
                        template: "modern",
                        status: "paid",
                        createdAt: p.createdAt,
                        updatedAt: p.createdAt,
                      };
                      openPrinterModal(inv as any, p);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                    title="Print via Bluetooth or Hotspot Thermal POS"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Thermal Print
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete payment of ${formatCurrency(p.amount, currency)}?`)) {
                        deletePayment(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Payment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {modals.payment.open && <RecordPaymentModal />}
    </div>
  );
};

const RecordPaymentModal: React.FC = () => {
  const { currentBusiness, invoices, payments, modals, closePaymentModal, recordPayment, t } =
    useApp();

  const prefilledInvoice = modals.payment.invoice;

  // Unpaid invoices list
  const payableInvoices = invoices.filter((inv) => {
    if (inv.status === "cancelled") return false;
    const tot = calculateInvoiceTotals(inv, payments);
    return tot.remainingBalance > 0 || inv.id === prefilledInvoice?.id;
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    prefilledInvoice?.id || payableInvoices[0]?.id || ""
  );

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const invoiceTotals = selectedInvoice ? calculateInvoiceTotals(selectedInvoice, payments) : null;

  const [amount, setAmount] = useState<number>(invoiceTotals ? invoiceTotals.remainingBalance : 0);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const currency = currentBusiness.currency || "USD";

  // When invoice changes, update suggested amount
  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      const tot = calculateInvoiceTotals(inv, payments);
      setAmount(tot.remainingBalance);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      alert("Please select an invoice.");
      return;
    }
    if (amount <= 0) {
      alert("Payment amount must be greater than 0.");
      return;
    }

    recordPayment({
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      amount: Number(amount),
      date,
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
    });

    closePaymentModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t.recordPayment}</h3>
          </div>
          <button
            onClick={closePaymentModal}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Invoice *
            </label>
            <select
              required
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {payableInvoices.map((inv) => {
                const tot = calculateInvoiceTotals(inv, payments);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customerName} (Bal: {formatCurrency(tot.remainingBalance, currency)})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedInvoice && invoiceTotals && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-bold text-slate-800">{formatCurrency(invoiceTotals.grandTotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(invoiceTotals.amountPaid, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-indigo-100">
                <span>Remaining Balance:</span>
                <span className="text-rose-600">{formatCurrency(invoiceTotals.remainingBalance, currency)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payment Amount ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="bank_transfer">Bank Transfer / Wire</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cheque">Cheque</option>
                <option value="upi_easypaisa_jazzcash">UPI / EasyPaisa / JazzCash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Reference # (Auth / Transaction ID)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-94819"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full via company wire"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closePaymentModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
