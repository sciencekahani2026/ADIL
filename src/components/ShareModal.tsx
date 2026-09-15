import React, { useState } from "react";
import {
  X,
  Share2,
  MessageCircle,
  Mail,
  Copy,
  Check,
  FileDown,
  Printer,
  Smartphone,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";
import { downloadInvoicePdf, printInvoicePdf } from "../utils/pdfGenerator";

export const ShareModal: React.FC = () => {
  const { currentBusiness, payments, modals, closeShareModal } = useApp();
  const invoice = modals.share.invoice;

  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const currency = currentBusiness.currency || "USD";
  const totals = calculateInvoiceTotals(invoice, payments);

  const defaultMessage = `Hello ${invoice.customerName},

Your invoice ${invoice.invoiceNumber} from ${currentBusiness.name} is ready.
Amount: ${formatCurrency(totals.grandTotal, currency)}
Due Date: ${invoice.dueDate}

Thank you for choosing ${currentBusiness.name}!`;

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  // 1. Native System Share (Android Intent / iOS Share Sheet)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber} - ${currentBusiness.name}`,
          text: customMessage,
        });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      handleCopy();
      alert("Native share is not available on this browser. Message copied to clipboard!");
    }
  };

  // 2. WhatsApp Share
  const handleWhatsApp = () => {
    const cleanPhone = (invoice.customerPhone || "").replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(customMessage);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank");
  };

  // 3. Email Share
  const handleEmail = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${currentBusiness.name}`);
    const body = encodeURIComponent(customMessage);
    const mailto = `mailto:${invoice.customerEmail || ""}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  // 4. Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Share Invoice</h3>
              <p className="text-[10px] text-slate-500">#{invoice.invoiceNumber} • {invoice.customerName}</p>
            </div>
          </div>
          <button
            onClick={closeShareModal}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Editable Message Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message Preview</label>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed"
            />
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              Native Share Sheet
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold active:scale-95 transition-all"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>

          {/* Document Operations */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => downloadInvoicePdf(invoice, currentBusiness, payments)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
            >
              <FileDown className="w-3.5 h-3.5" />
              Save PDF
            </button>
            <button
              onClick={() => printInvoicePdf(invoice, currentBusiness, payments)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
