import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  User,
  Package,
  Percent,
  Truck,
  DollarSign,
  FileText,
  CreditCard,
  Check,
  AlertCircle,
  Sparkles,
  Save,
  Clock,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Invoice,
  InvoiceItem,
  DiscountType,
  TaxType,
  InvoiceTemplate,
  InvoiceStatus,
} from "../types";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";
import {
  InvoiceDraft,
  saveInvoiceDraft,
  getInvoiceDraft,
  clearInvoiceDraft,
} from "../utils/storage";

export const InvoiceEditor: React.FC = () => {
  const {
    currentBusiness,
    customers,
    products,
    modals,
    closeInvoiceEditor,
    saveInvoice,
    openCustomerModal,
    t,
  } = useApp();

  const editingInvoice = modals.invoiceEditor.invoice;
  const isNew = !editingInvoice;

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [taxType, setTaxType] = useState<TaxType>("exclusive");

  const [notes, setNotes] = useState<string>("");
  const [terms, setTerms] = useState<string>("");
  const [paymentInstructions, setPaymentInstructions] = useState<string>("");
  const [template, setTemplate] = useState<InvoiceTemplate>("modern");
  const [status, setStatus] = useState<InvoiceStatus>("draft");

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-Save Draft State
  const [availableDraft, setAvailableDraft] = useState<InvoiceDraft | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<{
    savedAt: Date | null;
    message: string;
    isError?: boolean;
  }>({
    savedAt: null,
    message: "Auto-saves every 30s",
  });

  const currency = currentBusiness.currency || "USD";

  // Reference holding the freshest form data for timer without resetting interval
  const formDataRef = useRef<InvoiceDraft["formData"]>({
    invoiceNumber,
    invoiceDate,
    dueDate,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items,
    discountType,
    discountValue,
    shipping,
    additionalCharges,
    taxType,
    notes,
    terms,
    paymentInstructions,
    template,
    status,
  });

  useEffect(() => {
    formDataRef.current = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      discountType,
      discountValue,
      shipping,
      additionalCharges,
      taxType,
      notes,
      terms,
      paymentInstructions,
      template,
      status,
    };
  }, [
    invoiceNumber,
    invoiceDate,
    dueDate,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items,
    discountType,
    discountValue,
    shipping,
    additionalCharges,
    taxType,
    notes,
    terms,
    paymentInstructions,
    template,
    status,
  ]);

  // Save draft helper
  const handleSaveDraft = useCallback((isManual = false) => {
    if (!modals.invoiceEditor.open) return;
    const currentData = formDataRef.current;

    // Do not save if completely uninitialized
    if (!currentData.invoiceNumber && !currentData.customerName && currentData.items.length === 0) {
      return;
    }

    const saved = saveInvoiceDraft(
      currentBusiness.id,
      editingInvoice?.id,
      currentData
    );

    if (saved) {
      setAutoSaveStatus({
        savedAt: new Date(),
        message: isManual ? "Draft saved" : "Auto-saved draft",
        isError: false,
      });
    } else {
      setAutoSaveStatus({
        savedAt: new Date(),
        message: "Auto-save error",
        isError: true,
      });
    }
  }, [modals.invoiceEditor.open, currentBusiness.id, editingInvoice?.id]);

  // 30-second auto-save interval
  useEffect(() => {
    if (!modals.invoiceEditor.open) return;

    // Run auto-save every 30 seconds
    const intervalId = setInterval(() => {
      handleSaveDraft(false);
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [modals.invoiceEditor.open, handleSaveDraft]);

  // Window beforeunload safety to save draft before tab close
  useEffect(() => {
    if (!modals.invoiceEditor.open) return;

    const handleBeforeUnload = () => {
      handleSaveDraft(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [modals.invoiceEditor.open, handleSaveDraft]);

  // Check for saved draft when editor opens
  useEffect(() => {
    if (!modals.invoiceEditor.open) {
      setAvailableDraft(null);
      return;
    }

    const draft = getInvoiceDraft(currentBusiness.id, editingInvoice?.id);
    if (draft && draft.formData) {
      // Check if draft has content
      const hasContent =
        draft.formData.customerName ||
        draft.formData.customerEmail ||
        (draft.formData.items && draft.formData.items.length > 0) ||
        draft.formData.notes;

      if (hasContent) {
        setAvailableDraft(draft);
      }
    }
  }, [modals.invoiceEditor.open, currentBusiness.id, editingInvoice?.id]);

  // Draft restore and discard actions
  const handleRestoreDraft = () => {
    if (!availableDraft) return;
    const d = availableDraft.formData;
    if (d.invoiceNumber !== undefined) setInvoiceNumber(d.invoiceNumber);
    if (d.invoiceDate !== undefined) setInvoiceDate(d.invoiceDate);
    if (d.dueDate !== undefined) setDueDate(d.dueDate);
    if (d.customerId !== undefined) setCustomerId(d.customerId);
    if (d.customerName !== undefined) setCustomerName(d.customerName);
    if (d.customerEmail !== undefined) setCustomerEmail(d.customerEmail);
    if (d.customerPhone !== undefined) setCustomerPhone(d.customerPhone);
    if (d.customerAddress !== undefined) setCustomerAddress(d.customerAddress);
    if (d.items !== undefined) setItems(d.items);
    if (d.discountType !== undefined) setDiscountType(d.discountType);
    if (d.discountValue !== undefined) setDiscountValue(d.discountValue);
    if (d.shipping !== undefined) setShipping(d.shipping);
    if (d.additionalCharges !== undefined) setAdditionalCharges(d.additionalCharges);
    if (d.taxType !== undefined) setTaxType(d.taxType);
    if (d.notes !== undefined) setNotes(d.notes);
    if (d.terms !== undefined) setTerms(d.terms);
    if (d.paymentInstructions !== undefined) setPaymentInstructions(d.paymentInstructions);
    if (d.template !== undefined) setTemplate(d.template);
    if (d.status !== undefined) setStatus(d.status);

    setAvailableDraft(null);
    setAutoSaveStatus({
      savedAt: new Date(availableDraft.savedAt),
      message: "Draft restored",
      isError: false,
    });
  };

  const handleDiscardDraft = () => {
    clearInvoiceDraft(currentBusiness.id, editingInvoice?.id);
    setAvailableDraft(null);
  };

  const formatDraftRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
      if (diffSec < 30) return "just now";
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.round(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  // Initialize form fields
  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber);
      setInvoiceDate(editingInvoice.invoiceDate);
      setDueDate(editingInvoice.dueDate);
      setCustomerId(editingInvoice.customerId);
      setCustomerName(editingInvoice.customerName);
      setCustomerEmail(editingInvoice.customerEmail || "");
      setCustomerPhone(editingInvoice.customerPhone || "");
      setCustomerAddress(editingInvoice.customerAddress || "");
      setItems(editingInvoice.items || []);
      setDiscountType(editingInvoice.discountType || "percentage");
      setDiscountValue(editingInvoice.discountValue || 0);
      setShipping(editingInvoice.shipping || 0);
      setAdditionalCharges(editingInvoice.additionalCharges || 0);
      setTaxType(editingInvoice.taxType || "exclusive");
      setNotes(editingInvoice.notes || "");
      setTerms(editingInvoice.terms || "");
      setPaymentInstructions(editingInvoice.paymentInstructions || "");
      setTemplate(editingInvoice.template || "modern");
      setStatus(editingInvoice.status || "draft");
    } else {
      // New Invoice defaults
      const today = new Date().toISOString().split("T")[0];
      const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      setInvoiceNumber(`${currentBusiness.invoicePrefix}${currentBusiness.nextInvoiceNumber}`);
      setInvoiceDate(today);
      setDueDate(due);
      setCustomerId(customers[0]?.id || "");
      setCustomerName(customers[0]?.name || "");
      setCustomerEmail(customers[0]?.email || "");
      setCustomerPhone(customers[0]?.phone || "");
      setCustomerAddress(customers[0]?.address || "");

      // Initial line item
      setItems([
        {
          id: "item-" + Date.now(),
          name: products[0]?.name || "Standard Consultation",
          productId: products[0]?.id,
          quantity: 1,
          unitPrice: products[0]?.price || 100,
          taxRate: currentBusiness.defaultTaxRate || 0,
          unit: products[0]?.unit || "unit",
        },
      ]);

      setDiscountType("percentage");
      setDiscountValue(0);
      setShipping(0);
      setAdditionalCharges(0);
      setTaxType(currentBusiness.taxType || "exclusive");
      setNotes("Thank you for your business.");
      setTerms(currentBusiness.termsAndConditions || "");
      setPaymentInstructions(currentBusiness.paymentInfo || "");
      setTemplate(currentBusiness.defaultTemplate || "modern");
      setStatus("draft");
    }
  }, [editingInvoice, currentBusiness, customers, products]);

  // When customer dropdown changes, update snapshot contact details
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const selected = customers.find((c) => c.id === id);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerEmail(selected.email);
      setCustomerPhone(selected.phone);
      setCustomerAddress(selected.address);
    }
  };

  // Line item handlers
  const handleAddItem = (productId?: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItem: InvoiceItem = {
      id: "item-" + Date.now() + Math.random().toString(36).slice(2, 6),
      productId: prod?.id,
      name: prod?.name || "New Item",
      description: prod?.description || "",
      quantity: 1,
      unitPrice: prod ? prod.price : 0,
      taxRate: prod ? prod.taxRate : currentBusiness.defaultTaxRate,
      unit: prod?.unit || "unit",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, fields: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert("An invoice must contain at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculation totals
  const liveTotals = calculateInvoiceTotals({
    items,
    discountType,
    discountValue,
    shipping,
    additionalCharges,
    taxType,
  });

  // Save handler
  const handleSave = () => {
    setValidationError(null);

    if (!invoiceNumber.trim()) {
      setValidationError("Invoice number is required.");
      return;
    }
    if (!customerName.trim()) {
      setValidationError("Customer name is required.");
      return;
    }
    if (items.length === 0) {
      setValidationError("Please add at least one line item.");
      return;
    }
    for (const item of items) {
      if (!item.name.trim()) {
        setValidationError("Every line item must have a name.");
        return;
      }
      if (item.quantity <= 0) {
        setValidationError("Quantities must be greater than 0.");
        return;
      }
      if (item.unitPrice < 0) {
        setValidationError("Unit price cannot be negative.");
        return;
      }
    }

    const payload: Partial<Invoice> = {
      id: editingInvoice?.id,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      discountType,
      discountValue: Math.max(0, Number(discountValue) || 0),
      shipping: Math.max(0, Number(shipping) || 0),
      additionalCharges: Math.max(0, Number(additionalCharges) || 0),
      taxType,
      notes,
      terms,
      paymentInstructions,
      template,
      status,
    };

    // Clear draft from localStorage since invoice is now successfully finalized
    clearInvoiceDraft(currentBusiness.id, editingInvoice?.id);
    setAvailableDraft(null);

    saveInvoice(payload);
    closeInvoiceEditor();
  };

  if (!modals.invoiceEditor.open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900">
                {isNew ? t.newInvoice : `Edit Invoice ${invoiceNumber}`}
              </h2>
              <span
                id="invoice-auto-save-pill"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  autoSaveStatus.isError
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                }`}
                title="Auto-saves progress every 30 seconds to local storage"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {autoSaveStatus.message}
                {autoSaveStatus.savedAt && (
                  <span className="opacity-80">
                    • {autoSaveStatus.savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>{currentBusiness.name} • {currency}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Auto-saves every 30s
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="manual-save-draft-btn"
              onClick={() => handleSaveDraft(true)}
              title="Save draft progress to local storage now"
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              onClick={closeInvoiceEditor}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Auto-Saved Draft Restore Banner */}
          {availableDraft && (
            <div
              id="draft-restore-banner"
              className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/90 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 flex-wrap">
                    <span>Auto-Saved Draft Found</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      Saved {formatDraftRelativeTime(availableDraft.savedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Contains {availableDraft.formData.items?.length || 0} line items for "{availableDraft.formData.customerName || "Draft Customer"}" • Total: {formatCurrency(calculateInvoiceTotals(availableDraft.formData).grandTotal, currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  id="restore-draft-btn"
                  onClick={handleRestoreDraft}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Draft
                </button>
                <button
                  type="button"
                  id="discard-draft-btn"
                  onClick={handleDiscardDraft}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Customer Selection */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                Customer Details
              </label>
              <button
                type="button"
                onClick={() => openCustomerModal()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                + New Customer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Or enter custom name --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Johnathan Miller"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@customer.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* 2. Metadata (Invoice #, Dates, Template, Status) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.invoiceNumber}</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.invoiceDate}</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.dueDate}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* 3. Line Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                Line Items ({items.length})
              </label>

              {/* Quick Add From Catalog */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItem(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 border-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">+ Add from Catalog</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price, currency)})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                >
                  + Custom Line
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                        placeholder="Item name / Service description"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                        title="Remove Line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Qty</label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(index, { quantity: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Price ({currency})</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(index, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Tax %</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.taxRate}
                          onChange={(e) =>
                            handleUpdateItem(index, { taxRate: Math.max(0, parseFloat(e.target.value) || 0) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400">Total</label>
                        <div className="w-full bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-right">
                          {formatCurrency(lineTotal, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Tax, Discount, Shipping Controls */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Discount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Discount
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                />
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{currency}</option>
                </select>
              </div>
            </div>

            {/* Tax Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Tax Calculation
              </label>
              <select
                value={taxType}
                onChange={(e: any) => setTaxType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="exclusive">Tax Exclusive (Added to Total)</option>
                <option value="inclusive">Tax Inclusive (Included in Price)</option>
              </select>
            </div>

            {/* Shipping */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Shipping & Delivery
              </label>
              <input
                type="number"
                min="0"
                value={shipping}
                onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* 5. Template & Design Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Invoice Template Style
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(["modern", "classic", "simple", "professional", "compact"] as InvoiceTemplate[]).map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => setTemplate(tmpl)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    template === tmpl
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium"
                  }`}
                >
                  <div className="text-[11px] capitalize">{tmpl}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{t.notes}</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Message for customer..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {t.paymentInstructions}
              </label>
              <textarea
                rows={2}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Bank account details, UPI ID, etc."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Sticky Live Total Calculation Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white shadow-lg flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Grand Total ({taxType === "inclusive" ? "Tax Incl." : "Tax Excl."})
            </div>
            <div className="text-xl font-black text-indigo-600">
              {formatCurrency(liveTotals.grandTotal, currency)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeInvoiceEditor}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
