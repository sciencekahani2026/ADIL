import React, { createContext, useContext, useState, useEffect } from "react";
import {
  BusinessProfile,
  Customer,
  ProductService,
  Invoice,
  Payment,
  Expense,
  AuditLog,
  AppNotification,
  UserRole,
  Language,
  ThemeMode,
} from "../types";
import {
  loadDatabase,
  saveDatabase,
  DatabaseState,
  exportDatabaseBackupJson,
  resetToDemoData,
} from "../utils/storage";
import { translations, Translations } from "../utils/i18n";
import { calculateInvoiceTotals } from "../utils/calculations";

export type NavTab =
  | "dashboard"
  | "invoices"
  | "customers"
  | "products"
  | "more"
  | "payments"
  | "expenses"
  | "reports"
  | "ai-assistant"
  | "settings"
  | "testing"
  | "flutter-code";

interface AppContextType {
  db: DatabaseState;
  currentBusiness: BusinessProfile;
  businesses: BusinessProfile[];
  customers: Customer[];
  products: ProductService[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  language: Language;
  direction: "ltr" | "rtl";
  t: Translations;
  themeMode: ThemeMode;
  userRole: UserRole;
  activeTab: NavTab;
  isPhoneFrame: boolean;
  searchQuery: string;

  // Setters & Actions
  setActiveTab: (tab: NavTab) => void;
  setLanguage: (lang: Language) => void;
  setThemeMode: (theme: ThemeMode) => void;
  setUserRole: (role: UserRole) => void;
  setIsPhoneFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
  setSearchQuery: (q: string) => void;
  setCurrentBusinessId: (id: string) => void;

  // Business CRUD
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  createBusiness: (profile: Omit<BusinessProfile, "id">) => void;

  // Customer CRUD
  saveCustomer: (customer: Partial<Customer>) => string;
  deleteCustomer: (id: string) => void;

  // Product CRUD
  saveProduct: (product: Partial<ProductService>) => string;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, delta: number) => void;

  // Invoice CRUD
  saveInvoice: (invoice: Partial<Invoice>) => string;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: Invoice["status"]) => void;

  // Payment CRUD
  recordPayment: (payment: Partial<Payment>) => string;
  deletePayment: (id: string) => void;

  // Expense CRUD
  saveExpense: (expense: Partial<Expense>) => string;
  deleteExpense: (id: string) => void;

  // Notifications & Audit
  markNotificationRead: (id: string) => void;
  addAuditLog: (action: string, details: string, recordId?: string) => void;

  // Database actions
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
  resetData: () => void;

  // Modals state
  modals: {
    invoiceEditor: { open: boolean; invoice?: Invoice };
    invoiceDetails: { open: boolean; invoice?: Invoice };
    customer: { open: boolean; customer?: Customer };
    product: { open: boolean; product?: ProductService };
    payment: { open: boolean; invoice?: Invoice; payment?: Payment };
    expense: { open: boolean; expense?: Expense };
    share: { open: boolean; invoice?: Invoice };
    printer: { open: boolean; invoice?: Invoice; payment?: Payment; defaultMode?: "bluetooth" | "hotspot" | "system" };
    testing: boolean;
    flutterExport: boolean;
  };
  openInvoiceEditor: (invoice?: Invoice) => void;
  closeInvoiceEditor: () => void;
  openInvoiceDetails: (invoice: Invoice) => void;
  closeInvoiceDetails: () => void;
  openCustomerModal: (customer?: Customer) => void;
  closeCustomerModal: () => void;
  openProductModal: (product?: ProductService) => void;
  closeProductModal: () => void;
  openPaymentModal: (invoice?: Invoice, payment?: Payment) => void;
  closePaymentModal: () => void;
  openExpenseModal: (expense?: Expense) => void;
  closeExpenseModal: () => void;
  openShareModal: (invoice: Invoice) => void;
  closeShareModal: () => void;
  openPrinterModal: (invoice?: Invoice, payment?: Payment, defaultMode?: "bluetooth" | "hotspot" | "system") => void;
  closePrinterModal: () => void;
  setTestingModalOpen: (open: boolean) => void;
  setFlutterExportModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => loadDatabase());
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("smart_invoice_language");
      const validLangs: Language[] = ["en", "ar", "hi", "de", "fr", "pt", "ru", "tr", "ur"];
      return validLangs.includes(saved as Language) ? (saved as Language) : "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("smart_invoice_language", lang);
    } catch {
      // ignore
    }
  };

  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [modals, setModals] = useState({
    invoiceEditor: { open: false as boolean, invoice: undefined as Invoice | undefined },
    invoiceDetails: { open: false as boolean, invoice: undefined as Invoice | undefined },
    customer: { open: false as boolean, customer: undefined as Customer | undefined },
    product: { open: false as boolean, product: undefined as ProductService | undefined },
    payment: { open: false as boolean, invoice: undefined as Invoice | undefined, payment: undefined as Payment | undefined },
    expense: { open: false as boolean, expense: undefined as Expense | undefined },
    share: { open: false as boolean, invoice: undefined as Invoice | undefined },
    printer: {
      open: false as boolean,
      invoice: undefined as Invoice | undefined,
      payment: undefined as Payment | undefined,
      defaultMode: undefined as "bluetooth" | "hotspot" | "system" | undefined,
    },
    testing: false,
    flutterExport: false,
  });

  // Keep db synced with localStorage
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  // Current active business
  const currentBusiness =
    db.businesses.find((b) => b.id === db.currentBusinessId) || db.businesses[0];

  // Business-scoped entities
  const businessCustomers = db.customers.filter((c) => c.businessId === currentBusiness.id);
  const businessProducts = db.products.filter((p) => p.businessId === currentBusiness.id);
  const businessInvoices = db.invoices.filter((i) => i.businessId === currentBusiness.id);
  const businessPayments = db.payments.filter((p) => p.businessId === currentBusiness.id);
  const businessExpenses = db.expenses.filter((e) => e.businessId === currentBusiness.id);
  const businessAuditLogs = db.auditLogs.filter((a) => a.businessId === currentBusiness.id);

  const direction = language === "ur" || language === "ar" ? "rtl" : "ltr";
  const t = translations[language] || translations.en;

  // Helpers
  const addAuditLog = (action: string, details: string, recordId?: string) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now() + Math.random().toString(36).slice(2, 6),
      businessId: currentBusiness.id,
      userName: db.currentUser.name,
      userRole: db.currentUser.role,
      action,
      details,
      recordId,
      timestamp: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  const setCurrentBusinessId = (id: string) => {
    setDb((prev) => ({ ...prev, currentBusinessId: id }));
  };

  const setUserRole = (role: UserRole) => {
    setDb((prev) => ({
      ...prev,
      currentUser: { ...prev.currentUser, role },
    }));
  };

  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    setDb((prev) => ({
      ...prev,
      businesses: prev.businesses.map((b) =>
        b.id === currentBusiness.id ? { ...b, ...profile } : b
      ),
    }));
    addAuditLog("Business Profile Updated", `Updated settings for ${currentBusiness.name}`);
  };

  const createBusiness = (profile: Omit<BusinessProfile, "id">) => {
    const newId = "biz-" + Date.now();
    const newBiz: BusinessProfile = {
      ...profile,
      id: newId,
    };
    setDb((prev) => ({
      ...prev,
      businesses: [...prev.businesses, newBiz],
      currentBusinessId: newId,
    }));
    addAuditLog("Business Created", `Created new business profile ${profile.name}`, newId);
  };

  // Customer CRUD
  const saveCustomer = (customer: Partial<Customer>): string => {
    const id = customer.id || "cust-" + Date.now();
    setDb((prev) => {
      const exists = prev.customers.some((c) => c.id === id);
      let updatedList: Customer[];
      if (exists) {
        updatedList = prev.customers.map((c) =>
          c.id === id ? ({ ...c, ...customer } as Customer) : c
        );
      } else {
        const newCustomer: Customer = {
          id,
          businessId: currentBusiness.id,
          name: customer.name || "Unnamed Customer",
          companyName: customer.companyName || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          taxNumber: customer.taxNumber || "",
          notes: customer.notes || "",
          createdAt: new Date().toISOString(),
        };
        updatedList = [newCustomer, ...prev.customers];
      }
      return { ...prev, customers: updatedList };
    });

    addAuditLog(
      customer.id ? "Customer Edited" : "Customer Created",
      `Customer ${customer.name || ""}`,
      id
    );
    return id;
  };

  const deleteCustomer = (id: string) => {
    const cust = db.customers.find((c) => c.id === id);
    setDb((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
    addAuditLog("Customer Deleted", `Deleted customer ${cust?.name || id}`, id);
  };

  // Product CRUD
  const saveProduct = (product: Partial<ProductService>): string => {
    const id = product.id || "prod-" + Date.now();
    setDb((prev) => {
      const exists = prev.products.some((p) => p.id === id);
      let updatedList: ProductService[];
      if (exists) {
        updatedList = prev.products.map((p) =>
          p.id === id ? ({ ...p, ...product } as ProductService) : p
        );
      } else {
        const newProd: ProductService = {
          id,
          businessId: currentBusiness.id,
          name: product.name || "New Product",
          sku: product.sku || "SKU-" + Math.floor(1000 + Math.random() * 9000),
          description: product.description || "",
          category: product.category || "General",
          type: product.type || "product",
          price: Number(product.price) || 0,
          cost: Number(product.cost) || 0,
          taxRate: Number(product.taxRate) || currentBusiness.defaultTaxRate,
          unit: product.unit || "unit",
          stockQuantity: Number(product.stockQuantity) || 0,
          lowStockThreshold: Number(product.lowStockThreshold) || 5,
        };
        updatedList = [newProd, ...prev.products];
      }
      return { ...prev, products: updatedList };
    });

    addAuditLog(
      product.id ? "Product Edited" : "Product Created",
      `Product ${product.name || ""}`,
      id
    );
    return id;
  };

  const deleteProduct = (id: string) => {
    const prod = db.products.find((p) => p.id === id);
    setDb((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    addAuditLog("Product Deleted", `Deleted product ${prod?.name || id}`, id);
  };

  const adjustStock = (productId: string, delta: number) => {
    setDb((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) }
          : p
      ),
    }));
  };

  // Invoice CRUD
  const saveInvoice = (invoiceData: Partial<Invoice>): string => {
    const isNew = !invoiceData.id;
    const id = invoiceData.id || "inv-" + Date.now();

    // Auto numbering if new
    let invoiceNumber = invoiceData.invoiceNumber;
    if (isNew && !invoiceNumber) {
      invoiceNumber = `${currentBusiness.invoicePrefix}${currentBusiness.nextInvoiceNumber}`;
    }

    const nowIso = new Date().toISOString();
    const finalInvoice: Invoice = {
      id,
      businessId: currentBusiness.id,
      invoiceNumber: invoiceNumber || "INV-001",
      invoiceDate: invoiceData.invoiceDate || nowIso.split("T")[0],
      dueDate: invoiceData.dueDate || nowIso.split("T")[0],
      customerId: invoiceData.customerId || "",
      customerName: invoiceData.customerName || "Walk-in Customer",
      customerEmail: invoiceData.customerEmail || "",
      customerPhone: invoiceData.customerPhone || "",
      customerAddress: invoiceData.customerAddress || "",
      items: invoiceData.items || [],
      discountType: invoiceData.discountType || "percentage",
      discountValue: Number(invoiceData.discountValue) || 0,
      shipping: Number(invoiceData.shipping) || 0,
      additionalCharges: Number(invoiceData.additionalCharges) || 0,
      taxType: invoiceData.taxType || currentBusiness.taxType || "exclusive",
      notes: invoiceData.notes || "",
      terms: invoiceData.terms || currentBusiness.termsAndConditions || "",
      paymentInstructions: invoiceData.paymentInstructions || currentBusiness.paymentInfo || "",
      template: invoiceData.template || currentBusiness.defaultTemplate || "modern",
      status: invoiceData.status || "draft",
      createdAt: invoiceData.createdAt || nowIso,
      updatedAt: nowIso,
    };

    setDb((prev) => {
      let updatedInvoices: Invoice[];
      if (isNew) {
        updatedInvoices = [finalInvoice, ...prev.invoices];
      } else {
        updatedInvoices = prev.invoices.map((inv) => (inv.id === id ? finalInvoice : inv));
      }

      // If new, increment business nextInvoiceNumber
      let updatedBusinesses = prev.businesses;
      if (isNew) {
        updatedBusinesses = prev.businesses.map((b) =>
          b.id === currentBusiness.id
            ? { ...b, nextInvoiceNumber: b.nextInvoiceNumber + 1 }
            : b
        );
      }

      return {
        ...prev,
        invoices: updatedInvoices,
        businesses: updatedBusinesses,
      };
    });

    // Auto decrement stock for products on new invoice
    if (isNew && finalInvoice.items) {
      finalInvoice.items.forEach((item) => {
        if (item.productId) {
          adjustStock(item.productId, -item.quantity);
        }
      });
    }

    addAuditLog(
      isNew ? "Invoice Created" : "Invoice Edited",
      `Invoice #${finalInvoice.invoiceNumber} for ${finalInvoice.customerName}`,
      id
    );

    return id;
  };

  const deleteInvoice = (id: string) => {
    const inv = db.invoices.find((i) => i.id === id);
    setDb((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
      payments: prev.payments.filter((p) => p.invoiceId !== id),
    }));
    addAuditLog("Invoice Deleted", `Deleted invoice #${inv?.invoiceNumber || id}`, id);
  };

  const updateInvoiceStatus = (id: string, status: Invoice["status"]) => {
    setDb((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) =>
        i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i
      ),
    }));
    addAuditLog("Invoice Status Changed", `Invoice ${id} status set to ${status}`, id);
  };

  // Payment CRUD
  const recordPayment = (paymentData: Partial<Payment>): string => {
    const id = paymentData.id || "pay-" + Date.now();
    const receiptNumber = paymentData.receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      id,
      businessId: currentBusiness.id,
      invoiceId: paymentData.invoiceId || "",
      invoiceNumber: paymentData.invoiceNumber || "",
      customerId: paymentData.customerId || "",
      customerName: paymentData.customerName || "",
      amount: Number(paymentData.amount) || 0,
      date: paymentData.date || new Date().toISOString().split("T")[0],
      paymentMethod: paymentData.paymentMethod || "bank_transfer",
      referenceNumber: paymentData.referenceNumber || "",
      notes: paymentData.notes || "",
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      const updatedPayments = [newPayment, ...prev.payments];
      // Recalculate invoice status automatically
      const targetInvoice = prev.invoices.find((i) => i.id === newPayment.invoiceId);
      let updatedInvoices = prev.invoices;

      if (targetInvoice) {
        const totals = calculateInvoiceTotals(targetInvoice, updatedPayments);
        updatedInvoices = prev.invoices.map((inv) =>
          inv.id === targetInvoice.id
            ? { ...inv, status: totals.effectiveStatus, updatedAt: new Date().toISOString() }
            : inv
        );
      }

      return {
        ...prev,
        payments: updatedPayments,
        invoices: updatedInvoices,
      };
    });

    addAuditLog(
      "Payment Recorded",
      `Payment of ${currentBusiness.currencySymbol}${newPayment.amount} for #${newPayment.invoiceNumber}`,
      id
    );

    return id;
  };

  const deletePayment = (id: string) => {
    const pay = db.payments.find((p) => p.id === id);
    setDb((prev) => {
      const updatedPayments = prev.payments.filter((p) => p.id !== id);
      // Recompute invoice status
      let updatedInvoices = prev.invoices;
      if (pay?.invoiceId) {
        const targetInvoice = prev.invoices.find((i) => i.id === pay.invoiceId);
        if (targetInvoice) {
          const totals = calculateInvoiceTotals(targetInvoice, updatedPayments);
          updatedInvoices = prev.invoices.map((inv) =>
            inv.id === targetInvoice.id ? { ...inv, status: totals.effectiveStatus } : inv
          );
        }
      }
      return {
        ...prev,
        payments: updatedPayments,
        invoices: updatedInvoices,
      };
    });
    addAuditLog("Payment Deleted", `Deleted payment ${id}`, id);
  };

  // Expense CRUD
  const saveExpense = (expenseData: Partial<Expense>): string => {
    const id = expenseData.id || "exp-" + Date.now();
    const newExpense: Expense = {
      id,
      businessId: currentBusiness.id,
      name: expenseData.name || "Expense",
      category: expenseData.category || "General",
      amount: Number(expenseData.amount) || 0,
      date: expenseData.date || new Date().toISOString().split("T")[0],
      paymentMethod: expenseData.paymentMethod || "cash",
      supplier: expenseData.supplier || "",
      notes: expenseData.notes || "",
      receiptImage: expenseData.receiptImage || "",
      createdAt: new Date().toISOString(),
    };

    setDb((prev) => {
      const exists = prev.expenses.some((e) => e.id === id);
      let updated: Expense[];
      if (exists) {
        updated = prev.expenses.map((e) => (e.id === id ? newExpense : e));
      } else {
        updated = [newExpense, ...prev.expenses];
      }
      return { ...prev, expenses: updated };
    });

    addAuditLog("Expense Saved", `Expense "${newExpense.name}" of ${newExpense.amount}`, id);
    return id;
  };

  const deleteExpense = (id: string) => {
    setDb((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
    addAuditLog("Expense Deleted", `Deleted expense ${id}`, id);
  };

  const markNotificationRead = (id: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  // Backup & restore
  const exportBackup = () => {
    exportDatabaseBackupJson(db);
    addAuditLog("Backup Exported", "Exported database state to local JSON file");
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.businesses && parsed.invoices) {
        setDb(parsed);
        addAuditLog("Backup Restored", "Restored database state from imported JSON file");
        return true;
      }
    } catch (e) {
      console.error("Backup import error:", e);
    }
    return false;
  };

  const resetData = () => {
    const fresh = resetToDemoData();
    setDb(fresh);
  };

  // Modal triggers
  const openInvoiceEditor = (invoice?: Invoice) => {
    setModals((prev) => ({ ...prev, invoiceEditor: { open: true, invoice } }));
  };
  const closeInvoiceEditor = () => {
    setModals((prev) => ({ ...prev, invoiceEditor: { open: false, invoice: undefined } }));
  };

  const openInvoiceDetails = (invoice: Invoice) => {
    setModals((prev) => ({ ...prev, invoiceDetails: { open: true, invoice } }));
  };
  const closeInvoiceDetails = () => {
    setModals((prev) => ({ ...prev, invoiceDetails: { open: false, invoice: undefined } }));
  };

  const openCustomerModal = (customer?: Customer) => {
    setModals((prev) => ({ ...prev, customer: { open: true, customer } }));
  };
  const closeCustomerModal = () => {
    setModals((prev) => ({ ...prev, customer: { open: false, customer: undefined } }));
  };

  const openProductModal = (product?: ProductService) => {
    setModals((prev) => ({ ...prev, product: { open: true, product } }));
  };
  const closeProductModal = () => {
    setModals((prev) => ({ ...prev, product: { open: false, product: undefined } }));
  };

  const openPaymentModal = (invoice?: Invoice, payment?: Payment) => {
    setModals((prev) => ({ ...prev, payment: { open: true, invoice, payment } }));
  };
  const closePaymentModal = () => {
    setModals((prev) => ({ ...prev, payment: { open: false, invoice: undefined, payment: undefined } }));
  };

  const openExpenseModal = (expense?: Expense) => {
    setModals((prev) => ({ ...prev, expense: { open: true, expense } }));
  };
  const closeExpenseModal = () => {
    setModals((prev) => ({ ...prev, expense: { open: false, expense: undefined } }));
  };

  const openShareModal = (invoice: Invoice) => {
    setModals((prev) => ({ ...prev, share: { open: true, invoice } }));
  };
  const closeShareModal = () => {
    setModals((prev) => ({ ...prev, share: { open: false, invoice: undefined } }));
  };

  const openPrinterModal = (
    invoice?: Invoice,
    payment?: Payment,
    defaultMode?: "bluetooth" | "hotspot" | "system"
  ) => {
    setModals((prev) => ({
      ...prev,
      printer: { open: true, invoice, payment, defaultMode },
    }));
  };
  const closePrinterModal = () => {
    setModals((prev) => ({
      ...prev,
      printer: { open: false, invoice: undefined, payment: undefined, defaultMode: undefined },
    }));
  };

  const setTestingModalOpen = (open: boolean) => {
    setModals((prev) => ({ ...prev, testing: open }));
  };

  const setFlutterExportModalOpen = (open: boolean) => {
    setModals((prev) => ({ ...prev, flutterExport: open }));
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentBusiness,
        businesses: db.businesses,
        customers: businessCustomers,
        products: businessProducts,
        invoices: businessInvoices,
        payments: businessPayments,
        expenses: businessExpenses,
        auditLogs: businessAuditLogs,
        notifications: db.notifications,
        language,
        direction,
        t,
        themeMode,
        userRole: db.currentUser.role,
        activeTab,
        isPhoneFrame,
        searchQuery,

        setActiveTab,
        setLanguage,
        setThemeMode: setThemeModeState,
        setUserRole,
        setIsPhoneFrame,
        setSearchQuery,
        setCurrentBusinessId,

        updateBusinessProfile,
        createBusiness,
        saveCustomer,
        deleteCustomer,
        saveProduct,
        deleteProduct,
        adjustStock,
        saveInvoice,
        deleteInvoice,
        updateInvoiceStatus,
        recordPayment,
        deletePayment,
        saveExpense,
        deleteExpense,
        markNotificationRead,
        addAuditLog,
        exportBackup,
        importBackup,
        resetData,

        modals,
        openInvoiceEditor,
        closeInvoiceEditor,
        openInvoiceDetails,
        closeInvoiceDetails,
        openCustomerModal,
        closeCustomerModal,
        openProductModal,
        closeProductModal,
        openPaymentModal,
        closePaymentModal,
        openExpenseModal,
        closeExpenseModal,
        openShareModal,
        closeShareModal,
        openPrinterModal,
        closePrinterModal,
        setTestingModalOpen,
        setFlutterExportModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
