import {
  BusinessProfile,
  Customer,
  ProductService,
  Invoice,
  InvoiceItem,
  DiscountType,
  TaxType,
  InvoiceTemplate,
  InvoiceStatus,
  Payment,
  Expense,
  AuditLog,
  AppNotification,
  UserRole,
} from "../types";

export interface DatabaseState {
  currentBusinessId: string;
  currentUser: {
    name: string;
    email: string;
    role: UserRole;
  };
  businesses: BusinessProfile[];
  customers: Customer[];
  products: ProductService[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  offlineQueue: Array<{
    id: string;
    action: string;
    timestamp: string;
    payload: any;
  }>;
}

const STORAGE_KEY = "smart_invoice_manager_data_v1";

export const initialBusinesses: BusinessProfile[] = [
  {
    id: "biz-1",
    name: "Apex Tech Studio",
    ownerName: "Sarah Jenkins",
    phone: "+1 (555) 234-5678",
    email: "billing@apexstudio.io",
    address: "742 Innovation Way, Suite 400, San Francisco, CA 94105",
    website: "https://apexstudio.io",
    logoUrl: "",
    taxNumber: "US-EIN-94827164",
    registrationNumber: "CA-CORP-481920",
    currency: "USD",
    currencySymbol: "$",
    defaultTaxRate: 8.5,
    taxType: "exclusive",
    invoicePrefix: "APX-",
    nextInvoiceNumber: 1005,
    paymentInfo: "Bank of America | Routing: 121000358 | Account: 4892019481 | Swift: BOFAUS3N",
    termsAndConditions: "Payment due within 15 days of invoice date. 1.5% monthly interest on overdue accounts.",
    defaultTemplate: "modern",
    primaryColor: "#2563eb",
  },
  {
    id: "biz-2",
    name: "Metro Supplies & Hardware",
    ownerName: "David Chen",
    phone: "+1 (555) 789-0123",
    email: "accounts@metrosupplies.com",
    address: "1050 Commercial Blvd, Chicago, IL 60607",
    website: "https://metrosupplies.com",
    logoUrl: "",
    taxNumber: "IL-SALESTAX-381920",
    registrationNumber: "IL-LLC-991823",
    currency: "USD",
    currencySymbol: "$",
    defaultTaxRate: 10.0,
    taxType: "exclusive",
    invoicePrefix: "MSH-",
    nextInvoiceNumber: 2040,
    paymentInfo: "Chase Business Banking | Acct: 839102948 | Wire Routing: 071000013",
    termsAndConditions: "Net 30 days. All returned goods subject to a 15% restocking fee.",
    defaultTemplate: "classic",
    primaryColor: "#059669",
  },
  {
    id: "biz-3",
    name: "Indus Global Traders",
    ownerName: "Tariq Mahmood",
    phone: "+92 300 1234567",
    email: "info@indusglobal.pk",
    address: "Blue Area, Jinnah Avenue, Islamabad, Pakistan",
    website: "https://indusglobal.pk",
    logoUrl: "",
    taxNumber: "NTN-7482910-3",
    registrationNumber: "SECP-PK-89102",
    currency: "PKR",
    currencySymbol: "Rs ",
    defaultTaxRate: 16.0,
    taxType: "exclusive",
    invoicePrefix: "IGT-",
    nextInvoiceNumber: 501,
    paymentInfo: "Habib Bank Limited (HBL) | IBAN: PK36HABB0001234567890102 | Account Title: Indus Global Traders",
    termsAndConditions: "Payment due upon receipt of goods. GST invoice valid for tax credit.",
    defaultTemplate: "professional",
    primaryColor: "#7c3aed",
  },
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    businessId: "biz-1",
    name: "Johnathan Miller",
    companyName: "Acme Cloud Dynamics",
    phone: "+1 (555) 345-6789",
    email: "john@acmeclouddynamics.com",
    address: "120 Market Street, Suite 900, San Jose, CA 95113",
    taxNumber: "US-94182930",
    notes: "Priority enterprise client. Preferred invoice delivery via email and PDF.",
    createdAt: "2026-08-10",
  },
  {
    id: "cust-2",
    businessId: "biz-1",
    name: "Emily Watson",
    companyName: "Starlight Media Group",
    phone: "+1 (555) 890-1234",
    email: "finance@starlightmedia.com",
    address: "450 Broadway, 11th Floor, New York, NY 10013",
    taxNumber: "US-11928374",
    notes: "Monthly retainer for UI/UX design and mobile app maintenance.",
    createdAt: "2026-08-15",
  },
  {
    id: "cust-3",
    businessId: "biz-1",
    name: "Marcus Aurelius Vance",
    companyName: "Vance Logistics Corp",
    phone: "+1 (555) 901-2345",
    email: "mvance@vancelogistics.com",
    address: "88 Harbor Highway, Oakland, CA 94607",
    taxNumber: "US-78291038",
    notes: "Custom freight tracking dashboard development project.",
    createdAt: "2026-08-20",
  },
];

export const initialProducts: ProductService[] = [
  {
    id: "prod-1",
    businessId: "biz-1",
    name: "Mobile App Development (Hourly)",
    sku: "SRV-MOB-HR",
    description: "Senior Flutter / React Native cross-platform app engineering",
    category: "Development",
    type: "service",
    price: 120,
    cost: 50,
    taxRate: 8.5,
    unit: "hrs",
    stockQuantity: 999,
    lowStockThreshold: 10,
  },
  {
    id: "prod-2",
    businessId: "biz-1",
    name: "UI/UX Design System Package",
    sku: "SRV-DSGN-PKG",
    description: "Complete Figma design system, component tokens, and responsive screens",
    category: "Design",
    type: "service",
    price: 3500,
    cost: 1200,
    taxRate: 8.5,
    unit: "package",
    stockQuantity: 50,
    lowStockThreshold: 5,
  },
  {
    id: "prod-3",
    businessId: "biz-1",
    name: "Cloud Server Deployment & CI/CD",
    sku: "SRV-OPS-SETUP",
    description: "Dockerized Cloud Run, SSL setup, and automated GitHub actions pipeline",
    category: "DevOps",
    type: "service",
    price: 1800,
    cost: 600,
    taxRate: 8.5,
    unit: "unit",
    stockQuantity: 20,
    lowStockThreshold: 2,
  },
  {
    id: "prod-4",
    businessId: "biz-1",
    name: "Enterprise Dedicated Server Box",
    sku: "HW-SRV-1U",
    description: "1U Rackmount Server, 64GB RAM, Dual NVMe SSDs",
    category: "Hardware",
    type: "product",
    price: 2400,
    cost: 1600,
    taxRate: 8.5,
    unit: "unit",
    stockQuantity: 2, // low stock!
    lowStockThreshold: 5,
  },
  {
    id: "prod-5",
    businessId: "biz-1",
    name: "Thermal POS Receipt Paper (Box of 50)",
    sku: "POS-THM-80MM",
    description: "80mm x 80mm Premium BPA-free thermal receipt rolls",
    category: "Supplies",
    type: "product",
    price: 45,
    cost: 22,
    taxRate: 8.5,
    unit: "box",
    stockQuantity: 0, // out of stock!
    lowStockThreshold: 10,
  },
  {
    id: "prod-6",
    businessId: "biz-1",
    name: "Omnidirectional Barcode Scanner",
    sku: "POS-SCN-2D",
    description: "USB & Bluetooth 2D QR and barcode handheld scanner",
    category: "Hardware",
    type: "product",
    price: 180,
    cost: 95,
    taxRate: 8.5,
    unit: "unit",
    stockQuantity: 28, // well stocked
    lowStockThreshold: 6,
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: "inv-1001",
    businessId: "biz-1",
    invoiceNumber: "APX-1001",
    invoiceDate: "2026-08-25",
    dueDate: "2026-09-10",
    customerId: "cust-1",
    customerName: "Johnathan Miller",
    customerEmail: "john@acmeclouddynamics.com",
    customerPhone: "+1 (555) 345-6789",
    customerAddress: "120 Market Street, Suite 900, San Jose, CA 95113",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        name: "Mobile App Development (Hourly)",
        description: "Sprint 1 & 2 Core Flutter architecture and Firestore sync",
        quantity: 40,
        unitPrice: 120,
        taxRate: 8.5,
        unit: "hrs",
      },
      {
        id: "item-2",
        productId: "prod-3",
        name: "Cloud Server Deployment & CI/CD",
        description: "Cloud Run and automated testing setup",
        quantity: 1,
        unitPrice: 1800,
        taxRate: 8.5,
        unit: "unit",
      },
    ],
    discountType: "percentage",
    discountValue: 5,
    shipping: 0,
    additionalCharges: 0,
    taxType: "exclusive",
    notes: "Sprint 1 deliverables completed and deployed to staging.",
    terms: "Net 15 days. Wire transfer preferred.",
    paymentInstructions: "Please reference APX-1001 on your remittance wire.",
    template: "modern",
    status: "paid",
    createdAt: "2026-08-25T10:00:00Z",
    updatedAt: "2026-08-28T14:30:00Z",
  },
  {
    id: "inv-1002",
    businessId: "biz-1",
    invoiceNumber: "APX-1002",
    invoiceDate: "2026-09-01",
    dueDate: "2026-09-15",
    customerId: "cust-2",
    customerName: "Emily Watson",
    customerEmail: "finance@starlightmedia.com",
    customerPhone: "+1 (555) 890-1234",
    customerAddress: "450 Broadway, 11th Floor, New York, NY 10013",
    items: [
      {
        id: "item-3",
        productId: "prod-2",
        name: "UI/UX Design System Package",
        description: "High fidelity design tokens, components, and iOS/Android screens",
        quantity: 1,
        unitPrice: 3500,
        taxRate: 8.5,
        unit: "package",
      },
    ],
    discountType: "fixed",
    discountValue: 200,
    shipping: 0,
    additionalCharges: 50,
    taxType: "exclusive",
    notes: "Design files exported to Figma shared team library.",
    terms: "Due on September 15, 2026.",
    paymentInstructions: "ACH or Credit Card accepted via portal.",
    template: "professional",
    status: "partially_paid",
    createdAt: "2026-09-01T11:00:00Z",
    updatedAt: "2026-09-05T09:15:00Z",
  },
  {
    id: "inv-1003",
    businessId: "biz-1",
    invoiceNumber: "APX-1003",
    invoiceDate: "2026-08-12",
    dueDate: "2026-08-27", // Overdue!
    customerId: "cust-3",
    customerName: "Marcus Aurelius Vance",
    customerEmail: "mvance@vancelogistics.com",
    customerPhone: "+1 (555) 901-2345",
    customerAddress: "88 Harbor Highway, Oakland, CA 94607",
    items: [
      {
        id: "item-4",
        productId: "prod-1",
        name: "Mobile App Development (Hourly)",
        description: "Logistics vehicle driver barcode scanning module",
        quantity: 25,
        unitPrice: 120,
        taxRate: 8.5,
        unit: "hrs",
      },
      {
        id: "item-5",
        productId: "prod-4",
        name: "Enterprise Dedicated Server Box",
        description: "On-premise edge gateway server",
        quantity: 1,
        unitPrice: 2400,
        taxRate: 8.5,
        unit: "unit",
      },
    ],
    discountType: "percentage",
    discountValue: 0,
    shipping: 75,
    additionalCharges: 0,
    taxType: "exclusive",
    notes: "First notice: Invoice is past its due date. Please process urgently.",
    terms: "Overdue interest applies after 30 days.",
    paymentInstructions: "Direct deposit into Bank of America account.",
    template: "classic",
    status: "overdue",
    createdAt: "2026-08-12T09:00:00Z",
    updatedAt: "2026-08-12T09:00:00Z",
  },
  {
    id: "inv-1004",
    businessId: "biz-1",
    invoiceNumber: "APX-1004",
    invoiceDate: "2026-09-14",
    dueDate: "2026-09-28",
    customerId: "cust-1",
    customerName: "Johnathan Miller",
    customerEmail: "john@acmeclouddynamics.com",
    customerPhone: "+1 (555) 345-6789",
    customerAddress: "120 Market Street, Suite 900, San Jose, CA 95113",
    items: [
      {
        id: "item-6",
        productId: "prod-1",
        name: "Mobile App Development (Hourly)",
        description: "Phase 2 offline data cache & native PDF export features",
        quantity: 30,
        unitPrice: 120,
        taxRate: 8.5,
        unit: "hrs",
      },
    ],
    discountType: "percentage",
    discountValue: 0,
    shipping: 0,
    additionalCharges: 0,
    taxType: "exclusive",
    notes: "Phase 2 in progress. Draft invoice prepared for approval.",
    terms: "Net 14 days.",
    paymentInstructions: "Bank transfer",
    template: "simple",
    status: "draft",
    createdAt: "2026-09-14T15:30:00Z",
    updatedAt: "2026-09-14T15:30:00Z",
  },
];

export const initialPayments: Payment[] = [
  {
    id: "pay-1",
    businessId: "biz-1",
    invoiceId: "inv-1001",
    invoiceNumber: "APX-1001",
    customerId: "cust-1",
    customerName: "Johnathan Miller",
    amount: 6802.95, // Fully pays inv-1001
    date: "2026-08-28",
    paymentMethod: "bank_transfer",
    referenceNumber: "WIRE-BOFA-99210",
    notes: "Full payment received with gratitude.",
    receiptNumber: "REC-1001",
    createdAt: "2026-08-28T14:30:00Z",
  },
  {
    id: "pay-2",
    businessId: "biz-1",
    invoiceId: "inv-1002",
    invoiceNumber: "APX-1002",
    customerId: "cust-2",
    customerName: "Emily Watson",
    amount: 2000.0, // Partial payment
    date: "2026-09-05",
    paymentMethod: "card",
    referenceNumber: "AUTH-STRIPE-48192",
    notes: "50% upfront retainer deposit paid by corporate card.",
    receiptNumber: "REC-1002",
    createdAt: "2026-09-05T09:15:00Z",
  },
];

export const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    businessId: "biz-1",
    name: "AWS & Google Cloud Infrastructure",
    category: "Hosting & Cloud",
    amount: 420.5,
    date: "2026-09-02",
    paymentMethod: "card",
    supplier: "Google Cloud Platform",
    notes: "Monthly production compute, database, and storage instances",
    createdAt: "2026-09-02T10:00:00Z",
  },
  {
    id: "exp-2",
    businessId: "biz-1",
    name: "Figma & JetBrains Developer Licenses",
    category: "Software Subscriptions",
    amount: 290.0,
    date: "2026-09-04",
    paymentMethod: "card",
    supplier: "JetBrains & Figma",
    notes: "Design and IDE team seats",
    createdAt: "2026-09-04T12:00:00Z",
  },
  {
    id: "exp-3",
    businessId: "biz-1",
    name: "Office Fiber Internet Gigabit",
    category: "Utilities",
    amount: 149.99,
    date: "2026-09-08",
    paymentMethod: "bank_transfer",
    supplier: "Sonic Fiber Telecom",
    notes: "Primary dedicated fiber line",
    createdAt: "2026-09-08T11:00:00Z",
  },
  {
    id: "exp-4",
    businessId: "biz-1",
    name: "Client Lunch & Project Kickoff",
    category: "Meals & Entertainment",
    amount: 185.0,
    date: "2026-09-10",
    paymentMethod: "cash",
    supplier: "Bistro San Jose",
    notes: "Kickoff meeting with Acme Cloud leadership",
    createdAt: "2026-09-10T14:00:00Z",
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    businessId: "biz-1",
    userName: "Sarah Jenkins",
    userRole: "owner",
    action: "Invoice Created",
    details: "Created invoice APX-1001 for Johnathan Miller ($6,802.95)",
    recordId: "inv-1001",
    timestamp: "2026-08-25T10:00:00Z",
  },
  {
    id: "log-2",
    businessId: "biz-1",
    userName: "Sarah Jenkins",
    userRole: "owner",
    action: "Payment Recorded",
    details: "Recorded wire payment of $6,802.95 for APX-1001",
    recordId: "pay-1",
    timestamp: "2026-08-28T14:30:00Z",
  },
  {
    id: "log-3",
    businessId: "biz-1",
    userName: "Sarah Jenkins",
    userRole: "owner",
    action: "Invoice Created",
    details: "Created invoice APX-1002 for Emily Watson ($3,630.50)",
    recordId: "inv-1002",
    timestamp: "2026-09-01T11:00:00Z",
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "Invoice Overdue Notice",
    message: "Invoice APX-1003 for Marcus Vance ($5,938.88) is overdue.",
    type: "danger",
    date: "2026-08-28",
    read: false,
    linkTab: "invoices",
  },
  {
    id: "notif-2",
    title: "Low Stock Warning",
    message: "Enterprise Dedicated Server Box stock is down to 3 (Threshold: 5).",
    type: "warning",
    date: "2026-09-12",
    read: false,
    linkTab: "products",
  },
  {
    id: "notif-3",
    title: "Partial Payment Received",
    message: "Emily Watson paid $2,000.00 towards invoice APX-1002.",
    type: "success",
    date: "2026-09-05",
    read: true,
    linkTab: "payments",
  },
];

export function loadDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.businesses && parsed.businesses.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to parse stored data, using initial defaults:", err);
  }

  const defaultDb: DatabaseState = {
    currentBusinessId: "biz-1",
    currentUser: {
      name: "Sarah Jenkins",
      email: "sarah@apexstudio.io",
      role: "owner",
    },
    businesses: initialBusinesses,
    customers: initialCustomers,
    products: initialProducts,
    invoices: initialInvoices,
    payments: initialPayments,
    expenses: initialExpenses,
    auditLogs: initialAuditLogs,
    notifications: initialNotifications,
    offlineQueue: [],
  };

  saveDatabase(defaultDb);
  return defaultDb;
}

export function saveDatabase(db: DatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("Failed to persist database state to localStorage:", err);
  }
}

export function exportDatabaseBackupJson(db: DatabaseState): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `SmartInvoice_Backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToDemoData(): DatabaseState {
  localStorage.removeItem(STORAGE_KEY);
  return loadDatabase();
}

// ==========================================
// INVOICE DRAFT AUTO-SAVE (LOCAL STORAGE)
// ==========================================

export interface InvoiceDraftFormData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  discountType: DiscountType;
  discountValue: number;
  shipping: number;
  additionalCharges: number;
  taxType: TaxType;
  notes: string;
  terms: string;
  paymentInstructions: string;
  template: InvoiceTemplate;
  status: InvoiceStatus;
}

export interface InvoiceDraft {
  businessId: string;
  invoiceId?: string;
  savedAt: string; // ISO string
  formData: InvoiceDraftFormData;
}

export const DRAFT_STORAGE_PREFIX = "smart_invoice_draft_";

export function getDraftStorageKey(businessId: string, invoiceId?: string): string {
  return `${DRAFT_STORAGE_PREFIX}${businessId}_${invoiceId || "new"}`;
}

export function saveInvoiceDraft(
  businessId: string,
  invoiceId: string | undefined,
  formData: InvoiceDraftFormData
): InvoiceDraft | null {
  try {
    const draft: InvoiceDraft = {
      businessId,
      invoiceId,
      savedAt: new Date().toISOString(),
      formData,
    };
    const key = getDraftStorageKey(businessId, invoiceId);
    localStorage.setItem(key, JSON.stringify(draft));
    return draft;
  } catch (err) {
    console.warn("Error saving invoice draft to localStorage:", err);
    return null;
  }
}

export function getInvoiceDraft(businessId: string, invoiceId?: string): InvoiceDraft | null {
  try {
    const key = getDraftStorageKey(businessId, invoiceId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: InvoiceDraft = JSON.parse(raw);
    if (parsed && parsed.formData && parsed.businessId === businessId) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("Error loading invoice draft from localStorage:", err);
    return null;
  }
}

export function clearInvoiceDraft(businessId: string, invoiceId?: string): void {
  try {
    const key = getDraftStorageKey(businessId, invoiceId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("Error clearing invoice draft from localStorage:", err);
  }
}

