import {
  Invoice,
  BusinessProfile,
  Payment,
  PrinterPaperWidth,
} from "../types";
import { calculateInvoiceTotals, formatCurrency } from "./calculations";

export interface EscPosReceiptOptions {
  paperWidth?: PrinterPaperWidth;
  autoCut?: boolean;
  openCashDrawer?: boolean;
  customHeader?: string;
  customFooter?: string;
}

/**
 * Pads a 2-column text line to exact printer line width (e.g. left text and right aligned price)
 */
export function padColumns(
  left: string,
  right: string,
  width: number
): string {
  const leftTrim = left.substring(0, Math.max(0, width - right.length - 1));
  const spaceNeeded = Math.max(1, width - leftTrim.length - right.length);
  return leftTrim + " ".repeat(spaceNeeded) + right;
}

/**
 * Returns column width based on thermal paper spec (32 for 58mm, 48 for 80mm)
 */
export function getLineWidth(paperWidth: PrinterPaperWidth = "58mm"): number {
  return paperWidth === "80mm" ? 48 : 32;
}

/**
 * Generates formatted text layout for thermal receipts
 */
export function generateThermalReceiptText(
  invoice: Invoice,
  business: BusinessProfile,
  payments: Payment[] = [],
  options: EscPosReceiptOptions = {}
): string {
  const width = getLineWidth(options.paperWidth || "58mm");
  const divider = "-".repeat(width);
  const doubleDivider = "=".repeat(width);
  const currency = business.currency || "USD";
  const totals = calculateInvoiceTotals(invoice, payments);

  const lines: string[] = [];

  // 1. Business Header
  lines.push(business.name.toUpperCase());
  if (business.address) lines.push(business.address);
  if (business.phone) lines.push(`Tel: ${business.phone}`);
  if (business.email) lines.push(`Email: ${business.email}`);
  if (business.taxNumber) lines.push(`Tax / VAT #: ${business.taxNumber}`);

  if (options.customHeader) {
    lines.push(options.customHeader);
  }

  lines.push(doubleDivider);

  // 2. Invoice Meta
  lines.push(padColumns(`INVOICE: ${invoice.invoiceNumber}`, `STATUS: ${totals.effectiveStatus.toUpperCase()}`, width));
  lines.push(padColumns(`Date: ${invoice.invoiceDate}`, `Due: ${invoice.dueDate}`, width));
  lines.push(padColumns(`Customer:`, invoice.customerName.slice(0, 18), width));
  if (invoice.customerPhone) {
    lines.push(padColumns(`Phone:`, invoice.customerPhone, width));
  }

  lines.push(divider);

  // 3. Line Items
  if (width >= 48) {
    // 80mm wide format
    lines.push(padColumns("ITEM / DESC", "QTY x PRICE   TOTAL", width));
  } else {
    // 58mm narrow format
    lines.push(padColumns("ITEM [QTY x PRICE]", "TOTAL", width));
  }
  lines.push(divider);

  for (const item of invoice.items) {
    const itemTotal = (item.quantity * item.unitPrice).toFixed(2);
    const itemMeta = `${item.quantity} x ${formatCurrency(item.unitPrice, currency)}`;

    if (width >= 48) {
      const rightPart = `${itemMeta.padStart(16)}  ${formatCurrency(Number(itemTotal), currency).padStart(10)}`;
      lines.push(padColumns(item.name, rightPart, width));
    } else {
      lines.push(item.name.slice(0, width));
      lines.push(padColumns(`  ${itemMeta}`, formatCurrency(Number(itemTotal), currency), width));
    }
  }

  lines.push(divider);

  // 4. Financial Totals
  lines.push(padColumns("Subtotal:", formatCurrency(totals.subtotal, currency), width));
  if (totals.discountAmount > 0) {
    lines.push(padColumns("Discount:", `-${formatCurrency(totals.discountAmount, currency)}`, width));
  }
  if (totals.taxAmount > 0) {
    lines.push(padColumns(`Tax (${business.taxType === "inclusive" ? "Incl" : "Excl"}):`, `+${formatCurrency(totals.taxAmount, currency)}`, width));
  }
  if (totals.shipping > 0) {
    lines.push(padColumns("Shipping:", `+${formatCurrency(totals.shipping, currency)}`, width));
  }
  if (totals.additionalCharges > 0) {
    lines.push(padColumns("Extra Charges:", `+${formatCurrency(totals.additionalCharges, currency)}`, width));
  }

  lines.push(doubleDivider);
  lines.push(padColumns("GRAND TOTAL:", formatCurrency(totals.grandTotal, currency), width));
  lines.push(doubleDivider);

  // 5. Payment Details
  lines.push(padColumns("Amount Paid:", formatCurrency(totals.amountPaid, currency), width));
  lines.push(padColumns("Balance Due:", formatCurrency(totals.remainingBalance, currency), width));

  if (payments.length > 0) {
    lines.push(divider);
    lines.push("PAYMENTS LOGGED:");
    for (const p of payments) {
      const methodStr = (p.paymentMethod || "cash").replace("_", " ").toUpperCase();
      lines.push(padColumns(`${p.date} (${methodStr})`, formatCurrency(p.amount, currency), width));
    }
  }

  // 6. Notes & Terms
  if (invoice.notes) {
    lines.push(divider);
    lines.push(`Notes: ${invoice.notes}`);
  }

  // 7. Footer
  lines.push(divider);
  lines.push("Thank you for your business!");
  if (options.customFooter) {
    lines.push(options.customFooter);
  }
  lines.push(`Printed: ${new Date().toLocaleString()}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Generates formatted text layout for a Payment Receipt
 */
export function generateThermalPaymentReceiptText(
  payment: Payment,
  invoice: Invoice,
  business: BusinessProfile,
  allPayments: Payment[] = [],
  options: EscPosReceiptOptions = {}
): string {
  const width = getLineWidth(options.paperWidth || "58mm");
  const divider = "-".repeat(width);
  const doubleDivider = "=".repeat(width);
  const currency = business.currency || "USD";
  const totals = calculateInvoiceTotals(invoice, allPayments);

  const lines: string[] = [];

  lines.push(business.name.toUpperCase());
  if (business.address) lines.push(business.address);
  if (business.phone) lines.push(`Tel: ${business.phone}`);
  lines.push(doubleDivider);
  lines.push(padColumns("OFFICIAL RECEIPT", `#${payment.receiptNumber || payment.id.slice(0, 8)}`, width));
  const payMethod = (payment.paymentMethod || "cash").replace("_", " ").toUpperCase();
  lines.push(padColumns(`Date: ${payment.date}`, `Method: ${payMethod}`, width));
  lines.push(padColumns(`For Invoice:`, invoice.invoiceNumber, width));
  lines.push(padColumns(`Received From:`, invoice.customerName, width));
  lines.push(doubleDivider);
  lines.push(padColumns("AMOUNT RECEIVED:", formatCurrency(payment.amount, currency), width));
  lines.push(doubleDivider);
  lines.push(padColumns("Invoice Total:", formatCurrency(totals.grandTotal, currency), width));
  lines.push(padColumns("Total Paid to Date:", formatCurrency(totals.amountPaid, currency), width));
  lines.push(padColumns("Remaining Balance:", formatCurrency(totals.remainingBalance, currency), width));

  if (payment.notes) {
    lines.push(divider);
    lines.push(`Notes: ${payment.notes}`);
  }

  lines.push(divider);
  lines.push("Payment Confirmed. Thank you!");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Builds binary ESC/POS command buffer (Uint8Array) for direct transmission to Bluetooth or Raw Socket Network printers
 */
export function buildEscPosBinary(
  text: string,
  options: EscPosReceiptOptions = {}
): Uint8Array {
  const bytes: number[] = [];

  // ESC @: Initialize printer
  bytes.push(0x1b, 0x40);

  // Cash Drawer Kick pulse if requested (Pin 2: 0x1B 0x70 0x00 0x19 0xFA)
  if (options.openCashDrawer) {
    bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
  }

  // Set line spacing to default (ESC 2)
  bytes.push(0x1b, 0x32);

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Header line formatting (bold, center)
    if (i === 0) {
      bytes.push(0x1b, 0x61, 0x01); // Center align
      bytes.push(0x1d, 0x21, 0x11); // Double width & height
      bytes.push(0x1b, 0x45, 0x01); // Bold on
      pushAscii(bytes, line + "\n");
      bytes.push(0x1d, 0x21, 0x00); // Normal size
      bytes.push(0x1b, 0x45, 0x00); // Bold off
      bytes.push(0x1b, 0x61, 0x00); // Left align
      continue;
    }

    // Grand total or headers bold
    const isSpecial = line.includes("GRAND TOTAL") || line.includes("AMOUNT RECEIVED");
    if (isSpecial) {
      bytes.push(0x1b, 0x45, 0x01); // Bold on
      pushAscii(bytes, line + "\n");
      bytes.push(0x1b, 0x45, 0x00); // Bold off
      continue;
    }

    // Centered footer message
    if (line.includes("Thank you for your business") || line.includes("Payment Confirmed")) {
      bytes.push(0x1b, 0x61, 0x01); // Center align
      pushAscii(bytes, line + "\n");
      bytes.push(0x1b, 0x61, 0x00); // Left align
      continue;
    }

    pushAscii(bytes, line + "\n");
  }

  // Feed 4 blank lines to clear tear bar
  bytes.push(0x1b, 0x64, 0x04);

  // Auto-cut command: GS V 66 0 (Cut with feed)
  if (options.autoCut !== false) {
    bytes.push(0x1d, 0x56, 0x42, 0x00);
  }

  return new Uint8Array(bytes);
}

function pushAscii(target: number[], str: string) {
  for (let j = 0; j < str.length; j++) {
    const code = str.charCodeAt(j);
    // Standard ASCII 32-126 or newline / return
    if (code === 10 || code === 13 || (code >= 32 && code <= 126)) {
      target.push(code);
    } else {
      // Fallback for special currency symbols like € or £ if in Latin-1
      if (code === 8364) target.push(0xee); // euro
      else if (code === 163) target.push(0x9c); // pound
      else if (code === 165) target.push(0x9d); // yen
      else target.push(0x3f); // '?'
    }
  }
}

/**
 * Builds a Test Print receipt for printer calibration & speed check
 */
export function generateTestReceiptText(
  printerName: string,
  connectionType: "bluetooth" | "hotspot" | "system",
  paperWidth: PrinterPaperWidth = "58mm"
): string {
  const width = getLineWidth(paperWidth);
  const divider = "-".repeat(width);
  const doubleDivider = "=".repeat(width);

  return [
    "SMART INVOICE MANAGER",
    "PRINTER HARDWARE TEST",
    doubleDivider,
    padColumns("DEVICE:", printerName.slice(0, 18), width),
    padColumns("CONNECTION:", connectionType.toUpperCase(), width),
    padColumns("PAPER WIDTH:", paperWidth, width),
    padColumns("TEST TIME:", new Date().toLocaleTimeString(), width),
    divider,
    "ALIGNMENT & FONT TEST:",
    padColumns("[LEFT ALIGNED]", "[RIGHT ALIGNED]", width),
    divider,
    "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz !@#$%^&*()",
    divider,
    "ESC/POS STATUS: SUCCESSFUL",
    "BLUETOOTH / HOTSPOT BRIDGE READY",
    divider,
    "*** END OF HARDWARE TEST ***",
    "",
  ].join("\n");
}
