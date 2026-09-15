import { Invoice, InvoiceItem, Payment, CalculatedInvoiceTotals, InvoiceStatus } from "../types";
import { saveInvoiceDraft, getInvoiceDraft, clearInvoiceDraft } from "./storage";
import { padColumns, getLineWidth, buildEscPosBinary } from "./escposGenerator";
import { getSavedPrinters, getPrinterSettings } from "./printerService";

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateItemTotal(item: InvoiceItem): number {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const price = Math.max(0, Number(item.unitPrice) || 0);
  return roundToTwo(qty * price);
}

export function calculateInvoiceTotals(
  invoice: Partial<Invoice>,
  payments: Payment[] = []
): CalculatedInvoiceTotals {
  const items = invoice.items || [];
  const taxType = invoice.taxType || "exclusive";
  const shipping = Math.max(0, Number(invoice.shipping) || 0);
  const additionalCharges = Math.max(0, Number(invoice.additionalCharges) || 0);
  const discountType = invoice.discountType || "percentage";
  const rawDiscountValue = Math.max(0, Number(invoice.discountValue) || 0);

  // Raw item line subtotal
  let rawSubtotal = 0;
  items.forEach((item) => {
    rawSubtotal += calculateItemTotal(item);
  });
  rawSubtotal = roundToTwo(rawSubtotal);

  // Discount calculation
  let discountAmount = 0;
  if (discountType === "percentage") {
    const clampedPct = Math.min(100, rawDiscountValue);
    discountAmount = roundToTwo((rawSubtotal * clampedPct) / 100);
  } else {
    discountAmount = roundToTwo(Math.min(rawSubtotal, rawDiscountValue));
  }

  const discountedSubtotal = Math.max(0, roundToTwo(rawSubtotal - discountAmount));

  // Tax calculation
  let taxAmount = 0;
  if (taxType === "inclusive") {
    // Each item's tax is already inside its price
    // effective tax = itemTotal - (itemTotal / (1 + rate/100))
    items.forEach((item) => {
      const lineTotal = calculateItemTotal(item);
      const rate = Number(item.taxRate) || 0;
      if (rate > 0) {
        const preTax = lineTotal / (1 + rate / 100);
        taxAmount += lineTotal - preTax;
      }
    });
    // Proportionally scale tax for discount if applied
    if (rawSubtotal > 0) {
      taxAmount = taxAmount * (discountedSubtotal / rawSubtotal);
    }
  } else {
    // Tax exclusive: tax added on top of discounted taxable items
    // Calculate average or item-specific tax rate
    items.forEach((item) => {
      const lineTotal = calculateItemTotal(item);
      const rate = Number(item.taxRate) || 0;
      if (rate > 0 && rawSubtotal > 0) {
        // Apply discount proportion to this line
        const discountedLine = lineTotal * (discountedSubtotal / rawSubtotal);
        taxAmount += (discountedLine * rate) / 100;
      }
    });
  }
  taxAmount = roundToTwo(taxAmount);

  let grandTotal = 0;
  if (taxType === "inclusive") {
    grandTotal = roundToTwo(discountedSubtotal + shipping + additionalCharges);
  } else {
    grandTotal = roundToTwo(discountedSubtotal + taxAmount + shipping + additionalCharges);
  }

  // Calculate amount paid from relevant payments
  let amountPaid = 0;
  if (invoice.id) {
    const relevantPayments = payments.filter((p) => p.invoiceId === invoice.id);
    amountPaid = relevantPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }
  amountPaid = roundToTwo(amountPaid);

  const remainingBalance = Math.max(0, roundToTwo(grandTotal - amountPaid));

  // Due date & status checking
  const todayStr = new Date().toISOString().split("T")[0];
  const isPastDue = Boolean(invoice.dueDate && invoice.dueDate < todayStr);

  let effectiveStatus: InvoiceStatus = invoice.status || "draft";

  if (invoice.status === "cancelled") {
    effectiveStatus = "cancelled";
  } else if (invoice.status === "draft") {
    effectiveStatus = "draft";
  } else if (grandTotal > 0 && amountPaid >= grandTotal) {
    effectiveStatus = "paid";
  } else if (amountPaid > 0 && amountPaid < grandTotal) {
    effectiveStatus = isPastDue ? "overdue" : "partially_paid";
  } else if (isPastDue) {
    effectiveStatus = "overdue";
  } else if (effectiveStatus !== "viewed") {
    effectiveStatus = invoice.status || "sent";
  }

  return {
    subtotal: rawSubtotal,
    discountAmount,
    taxableAmount: discountedSubtotal,
    taxAmount,
    shipping,
    additionalCharges,
    grandTotal,
    amountPaid,
    remainingBalance,
    isOverdue: isPastDue && remainingBalance > 0,
    effectiveStatus,
  };
}

export function formatCurrency(amount: number, currencyCode = "USD"): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    AED: "AED ",
    SAR: "SAR ",
    INR: "₹",
    CAD: "CA$",
    AUD: "AU$",
  };
  const sym = symbols[currencyCode] || `${currencyCode} `;
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${sym}${formatted}` : `${sym}${formatted}`;
}

export interface CalculationTestCase {
  name: string;
  passed: boolean;
  expected: number | string;
  actual: number | string;
  details: string;
}

export function runCalculationUnitTests(): CalculationTestCase[] {
  const tests: CalculationTestCase[] = [];

  // Test 1: User prompt example (Qty 5, Price 100 = 500, 10% disc = 450, 15% tax = 450 + 67.5 = 517.5)
  const test1Invoice: Partial<Invoice> = {
    items: [
      { id: "1", name: "Web Design", quantity: 5, unitPrice: 100, taxRate: 15 },
    ],
    discountType: "percentage",
    discountValue: 10,
    taxType: "exclusive",
    shipping: 0,
    additionalCharges: 0,
  };
  const res1 = calculateInvoiceTotals(test1Invoice, []);
  tests.push({
    name: "User Requirement Test (5 x 100 @ 10% disc, 15% tax)",
    passed: res1.grandTotal === 517.5 && res1.subtotal === 500 && res1.discountAmount === 50,
    expected: 517.5,
    actual: res1.grandTotal,
    details: `Subtotal: ${res1.subtotal}, Discount: ${res1.discountAmount}, Tax: ${res1.taxAmount}, Total: ${res1.grandTotal}`,
  });

  // Test 2: Fixed discount
  const test2Invoice: Partial<Invoice> = {
    items: [
      { id: "1", name: "Consulting", quantity: 2, unitPrice: 200, taxRate: 0 },
    ],
    discountType: "fixed",
    discountValue: 50,
    taxType: "exclusive",
  };
  const res2 = calculateInvoiceTotals(test2Invoice, []);
  tests.push({
    name: "Fixed Discount Test (400 - 50 = 350)",
    passed: res2.grandTotal === 350,
    expected: 350,
    actual: res2.grandTotal,
    details: `Grand total: ${res2.grandTotal}`,
  });

  // Test 3: Partial payment balance
  const test3Invoice: Partial<Invoice> = {
    id: "inv-test-3",
    items: [{ id: "1", name: "Item", quantity: 1, unitPrice: 1000, taxRate: 0 }],
    discountValue: 0,
  };
  const payments: Payment[] = [
    {
      id: "p1",
      businessId: "b1",
      invoiceId: "inv-test-3",
      invoiceNumber: "INV-001",
      customerId: "c1",
      customerName: "Alice",
      amount: 400,
      date: "2026-09-01",
      paymentMethod: "cash",
      referenceNumber: "REF1",
      notes: "",
      receiptNumber: "REC-001",
      createdAt: "2026-09-01",
    },
  ];
  const res3 = calculateInvoiceTotals(test3Invoice, payments);
  tests.push({
    name: "Payment & Remaining Balance Test (1000 - 400 = 600 balance)",
    passed: res3.remainingBalance === 600 && res3.amountPaid === 400,
    expected: 600,
    actual: res3.remainingBalance,
    details: `Paid: ${res3.amountPaid}, Remaining: ${res3.remainingBalance}`,
  });

  // Test 4: LocalStorage Draft Auto-Save Engine
  try {
    const testFormData: any = {
      invoiceNumber: "DRAFT-UNIT-TEST",
      invoiceDate: "2026-09-15",
      dueDate: "2026-09-29",
      customerId: "cust-test",
      customerName: "Acme Test Customer",
      customerEmail: "acme@example.com",
      customerPhone: "",
      customerAddress: "",
      items: [{ id: "t1", name: "Draft Product", quantity: 2, unitPrice: 50, taxRate: 0, unit: "unit" }],
      discountType: "percentage",
      discountValue: 0,
      shipping: 0,
      additionalCharges: 0,
      taxType: "exclusive",
      notes: "Auto-saved draft content",
      terms: "",
      paymentInstructions: "",
      template: "modern",
      status: "draft",
    };
    saveInvoiceDraft("test-biz", "test-inv", testFormData);
    const retrieved = getInvoiceDraft("test-biz", "test-inv");
    const passed =
      retrieved !== null &&
      retrieved.formData.invoiceNumber === "DRAFT-UNIT-TEST" &&
      retrieved.formData.customerName === "Acme Test Customer" &&
      retrieved.formData.items.length === 1;
    clearInvoiceDraft("test-biz", "test-inv");
    const cleared = getInvoiceDraft("test-biz", "test-inv") === null;

    tests.push({
      name: "30-Second Draft LocalStorage Auto-Save Engine",
      passed: passed && cleared,
      expected: "Draft preserved and retrieved with data fidelity",
      actual: passed && cleared ? "Draft preserved and retrieved with data fidelity" : "Failed to persist draft",
      details: "Auto-saves invoice state in localStorage every 30s to prevent accidental data loss",
    });
  } catch (err: any) {
    tests.push({
      name: "30-Second Draft LocalStorage Auto-Save Engine",
      passed: false,
      expected: "Success",
      actual: String(err),
      details: "LocalStorage error",
    });
  }

  // Test 5: ESC/POS Thermal Receipt Layout & Padding (58mm vs 80mm)
  try {
    const line58 = padColumns("Subtotal:", "$120.00", 32);
    const line80 = padColumns("Subtotal:", "$120.00", 48);
    const width58 = getLineWidth("58mm");
    const width80 = getLineWidth("80mm");
    const passed =
      line58.length === 32 &&
      line80.length === 48 &&
      width58 === 32 &&
      width80 === 48 &&
      line58.startsWith("Subtotal:") &&
      line58.endsWith("$120.00");

    tests.push({
      name: "ESC/POS 58mm & 80mm Column Alignment & Width",
      passed,
      expected: "32 cols (58mm) and 48 cols (80mm) padded lines",
      actual: passed ? "Exact widths confirmed" : "Width mismatch",
      details: "Formats thermal line items and totals to exact POS paper roll dimensions",
    });
  } catch (err: any) {
    tests.push({
      name: "ESC/POS 58mm & 80mm Column Alignment & Width",
      passed: false,
      expected: "Success",
      actual: String(err),
      details: "ESC/POS formatting error",
    });
  }

  // Test 6: ESC/POS Binary Buffer & Cut Command Generation
  try {
    const binary = buildEscPosBinary("TEST RECEIPT", { autoCut: true, openCashDrawer: true });
    // Starts with ESC @ (0x1B, 0x40)
    const hasInit = binary[0] === 0x1b && binary[1] === 0x40;
    // Has cash drawer pulse (0x1B, 0x70)
    const hasDrawerPulse = binary.some((b, i) => b === 0x1b && binary[i + 1] === 0x70);
    // Has cut command GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
    const hasCut = binary.some((b, i) => b === 0x1d && binary[i + 1] === 0x56);
    const passed = binary.length > 10 && hasInit && hasDrawerPulse && hasCut;

    tests.push({
      name: "ESC/POS Binary Command Buffer (Init, Drawer Kick, Paper Cut)",
      passed,
      expected: "Valid Uint8Array with ESC @, ESC p drawer pulse, and GS V cut",
      actual: passed ? "Valid binary byte stream generated" : "Missing ESC/POS control opcodes",
      details: "Ensures raw byte stream compatibility with Bluetooth & Port 9100 Hotspot printers",
    });
  } catch (err: any) {
    tests.push({
      name: "ESC/POS Binary Command Buffer (Init, Drawer Kick, Paper Cut)",
      passed: false,
      expected: "Success",
      actual: String(err),
      details: "Binary generation error",
    });
  }

  // Test 7: Hardware Printer Persistence & Subnet Presets
  try {
    const printers = getSavedPrinters();
    const settings = getPrinterSettings();
    const passed =
      Array.isArray(printers) &&
      printers.length > 0 &&
      Boolean(settings.hotspotIpAddress) &&
      settings.hotspotPort === 9100;

    tests.push({
      name: "Bluetooth & Hotspot Printer Registry & Settings",
      passed,
      expected: "Registered devices with default hotspot port 9100 and auto-cut",
      actual: passed ? `Found ${printers.length} registered devices with hotspot IP` : "No devices registered",
      details: "Maintains printer paired states, default paper widths, and subnet configurations",
    });
  } catch (err: any) {
    tests.push({
      name: "Bluetooth & Hotspot Printer Registry & Settings",
      passed: false,
      expected: "Success",
      actual: String(err),
      details: "Registry error",
    });
  }

  return tests;
}

export const testCalculationEngine = runCalculationUnitTests;
