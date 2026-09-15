import React, { useState } from "react";
import {
  X,
  FileDown,
  Printer,
  Share2,
  CreditCard,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Receipt,
  FileCheck,
  Bluetooth,
  Wifi,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";
import { downloadInvoicePdf, printInvoicePdf } from "../utils/pdfGenerator";
import { downloadReceiptPdf } from "../utils/receiptPdfGenerator";

export const InvoiceDetailsModal: React.FC = () => {
  const {
    currentBusiness,
    payments,
    modals,
    closeInvoiceDetails,
    openInvoiceEditor,
    openPaymentModal,
    openShareModal,
    openPrinterModal,
    deleteInvoice,
    updateInvoiceStatus,
    t,
  } = useApp();

  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const invoice = modals.invoiceDetails.invoice;
  if (!invoice) return null;

  const currency = currentBusiness.currency || "USD";
  const totals = calculateInvoiceTotals(invoice, payments);
  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);

  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-300",
    partially_paid: "bg-amber-50 text-amber-700 border-amber-300",
    sent: "bg-blue-50 text-blue-700 border-blue-300",
    draft: "bg-slate-100 text-slate-700 border-slate-300",
    overdue: "bg-rose-50 text-rose-700 border-rose-300",
    cancelled: "bg-gray-100 text-gray-500 border-gray-300",
    viewed: "bg-indigo-50 text-indigo-700 border-indigo-300",
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-3xl bg-white sm:rounded-3xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">{invoice.invoiceNumber}</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                statusStyles[totals.effectiveStatus] || "bg-slate-100"
              }`}
            >
              {totals.effectiveStatus.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                closeInvoiceDetails();
                openInvoiceEditor(invoice);
              }}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
              title="Edit Invoice"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
                  deleteInvoice(invoice.id);
                  closeInvoiceDetails();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeInvoiceDetails}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              id="details-download-pdf-btn"
              onClick={() => downloadInvoicePdf(invoice, currentBusiness, payments)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download PDF
            </button>

            {/* Smart Hardware & Thermal Printer Selector */}
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
                <button
                  id="details-print-hardware-btn"
                  onClick={() => openPrinterModal(invoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold active:scale-95 transition-all whitespace-nowrap"
                  title="Connect to Bluetooth or Hotspot Wi-Fi Printer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print Receipt</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 border-l border-slate-200 pl-1.5 ml-0.5">
                    <Bluetooth className="w-3 h-3 text-blue-500" />
                    <Wifi className="w-3 h-3 text-emerald-500" />
                  </span>
                </button>
                <button
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  className="px-1.5 bg-white hover:bg-slate-50 border-l border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showPrintMenu && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Printing Options
                  </div>
                  <button
                    onClick={() => {
                      setShowPrintMenu(false);
                      openPrinterModal(invoice, undefined, "bluetooth");
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2.5 font-medium"
                  >
                    <Bluetooth className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Bluetooth Thermal</div>
                      <div className="text-[10px] text-slate-400">Portable POS-58 / POS-80</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintMenu(false);
                      openPrinterModal(invoice, undefined, "hotspot");
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2.5 font-medium"
                  >
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Hotspot / Wi-Fi</div>
                      <div className="text-[10px] text-slate-400">Network IP (Port 9100)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintMenu(false);
                      printInvoicePdf(invoice, currentBusiness, payments);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 font-medium border-t border-slate-100"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Browser System Print</div>
                      <div className="text-[10px] text-slate-400">Standard A4 / Letter PDF</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => openShareModal(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 text-xs font-semibold active:scale-95 transition-all whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>

          {totals.remainingBalance > 0 && (
            <button
              onClick={() => openPaymentModal(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </button>
          )}
        </div>

        {/* Invoice Body Preview (Formatted document style) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
            {/* Header: Business & Invoice Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: currentBusiness.primaryColor || "#2563eb" }}
                  >
                    {currentBusiness.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-base font-black text-slate-900">{currentBusiness.name}</h3>
                </div>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <div>{currentBusiness.address}</div>
                  <div>{currentBusiness.email} • {currentBusiness.phone}</div>
                  {currentBusiness.taxNumber && (
                    <div className="font-semibold text-slate-600">Tax ID: {currentBusiness.taxNumber}</div>
                  )}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xl font-black text-slate-900 tracking-tight">INVOICE</div>
                <div className="text-xs font-bold text-slate-700 mt-1">#{invoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Date: <span className="font-semibold text-slate-700">{invoice.invoiceDate}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Due: <span className={`font-semibold ${totals.isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                    {invoice.dueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bill To</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{invoice.customerName}</div>
              {invoice.customerAddress && (
                <div className="text-xs text-slate-600 mt-0.5">{invoice.customerAddress}</div>
              )}
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                {invoice.customerEmail && <span>{invoice.customerEmail}</span>}
                {invoice.customerPhone && <span>{invoice.customerPhone}</span>}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Tax</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {invoice.items.map((item, idx) => {
                    const lineTot = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 pr-2">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-400">{item.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-slate-600">
                          {item.quantity} {item.unit || ""}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">
                          {item.taxRate}%
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(lineTot, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal, currency)}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatCurrency(totals.discountAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.taxType === "inclusive" ? "Included" : "Added"}):</span>
                  <span className="font-semibold">+{formatCurrency(totals.taxAmount, currency)}</span>
                </div>

                {totals.shipping > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping:</span>
                    <span className="font-semibold">+{formatCurrency(totals.shipping, currency)}</span>
                  </div>
                )}

                {totals.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Charges:</span>
                    <span className="font-semibold">+{formatCurrency(totals.additionalCharges, currency)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">{formatCurrency(totals.grandTotal, currency)}</span>
                </div>

                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Amount Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(totals.amountPaid, currency)}</span>
                </div>

                <div className="pt-1 border-t border-slate-100 flex justify-between text-xs font-bold">
                  <span>Balance Due:</span>
                  <span className={totals.remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}>
                    {formatCurrency(totals.remainingBalance, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Instructions & Notes */}
            {(invoice.paymentInstructions || invoice.notes || invoice.terms) && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                {invoice.paymentInstructions && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                      Payment Instructions
                    </div>
                    <div className="whitespace-pre-line text-[11px]">{invoice.paymentInstructions}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                      Terms & Conditions
                    </div>
                    <div className="whitespace-pre-line text-[11px]">{invoice.terms}</div>
                  </div>
                )}
              </div>
            )}

            {/* Payment History on this Invoice */}
            {invoicePayments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Recorded Payments ({invoicePayments.length})
                </div>

                <div className="space-y-1.5">
                  {invoicePayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {formatCurrency(p.amount, currency)} • {p.paymentMethod.replace("_", " ")}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Receipt #{p.receiptNumber} • {p.date}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadReceiptPdf(p, invoice, currentBusiness, payments)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                      >
                        Receipt PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Status Change */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quick Status:</span>
            <select
              value={invoice.status}
              onChange={(e: any) => updateInvoiceStatus(invoice.id, e.target.value)}
              className="bg-slate-100 border-0 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={closeInvoiceDetails}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
