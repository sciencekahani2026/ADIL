export type UserRole = "owner" | "admin" | "accountant" | "salesperson" | "employee";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type DiscountType = "percentage" | "fixed";
export type TaxType = "exclusive" | "inclusive";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "mobile_wallet" | "other";
export type InvoiceTemplate = "classic" | "modern" | "simple" | "professional" | "compact";
export type Language = "en" | "ar" | "hi" | "de" | "fr" | "pt" | "ru" | "tr" | "ur";
export type ThemeMode = "light" | "dark" | "system";

export interface BusinessProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logoUrl: string;
  taxNumber: string; // VAT / GST / Tax ID
  registrationNumber: string;
  currency: string; // USD, EUR, GBP, PKR, AED, SAR, INR
  currencySymbol: string;
  defaultTaxRate: number;
  taxType: TaxType;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paymentInfo: string; // Bank details, IBAN, UPI, etc.
  termsAndConditions: string;
  defaultTemplate: InvoiceTemplate;
  primaryColor: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  notes: string;
  createdAt: string;
}

export type ItemType = "product" | "service";

export interface ProductService {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  type: ItemType;
  price: number;
  cost: number;
  taxRate: number;
  unit: string; // pcs, hrs, days, kg, box
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unit?: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
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
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
  receiptNumber: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  supplier: string;
  notes: string;
  receiptImage?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  recordId?: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  date: string;
  read: boolean;
  linkTab?: string;
}

export interface CalculatedInvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  shipping: number;
  additionalCharges: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  isOverdue: boolean;
  effectiveStatus: InvoiceStatus;
}

// ==========================================
// PRINTER & HARDWARE INTEGRATION TYPES
// ==========================================

export type PrinterConnectionType = "bluetooth" | "hotspot" | "system";
export type PrinterPaperWidth = "58mm" | "80mm" | "a4";
export type PrinterProtocol = "raw9100" | "http_epos" | "system";

export interface PrinterDevice {
  id: string;
  name: string;
  type: PrinterConnectionType;
  // For Hotspot / Wi-Fi network printers:
  ipAddress?: string; // e.g. "192.168.43.100" or "192.168.1.200"
  port?: number;      // e.g. 9100 (RAW ESC/POS), 80, 8080 (HTTP)
  protocol?: PrinterProtocol;
  // For Bluetooth printers:
  bluetoothDeviceId?: string;
  bluetoothServiceUuid?: string;
  // Configuration:
  paperWidth: PrinterPaperWidth;
  autoCut: boolean;
  openCashDrawer: boolean;
  isDefault: boolean;
  lastConnectedAt?: string;
  batteryLevel?: number;
}

export interface PrinterSettings {
  defaultPrinterId?: string;
  defaultPaperWidth: PrinterPaperWidth;
  hotspotIpAddress: string; // e.g. "192.168.43.100"
  hotspotPort: number;       // default 9100
  hotspotProtocol: PrinterProtocol;
  bluetoothAutoReconnect: boolean;
  autoCutPaper: boolean;
  kickCashDrawer: boolean;
  printCopies: number;
  headerReceiptText?: string;
  footerReceiptText?: string;
}

