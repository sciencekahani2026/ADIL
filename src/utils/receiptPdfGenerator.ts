import { jsPDF } from "jspdf";
import { BusinessProfile, Invoice, Payment } from "../types";
import { formatCurrency, calculateInvoiceTotals } from "./calculations";

export function generateReceiptPdf(
  payment: Payment,
  invoice: Invoice,
  business: BusinessProfile,
  allPayments: Payment[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a5",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 30;
  const contentWidth = pageWidth - margin * 2;
  const currency = business.currency || "USD";
  const totals = calculateInvoiceTotals(invoice, allPayments);

  let y = 35;

  // Header band
  doc.setFillColor(16, 185, 129); // emerald green
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL PAYMENT RECEIPT", margin + 14, y + 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt #: ${payment.receiptNumber || "REC-" + payment.id.slice(0, 6)}`, margin + 14, y + 38);
  doc.text(`Date: ${payment.date}`, pageWidth - margin - 14, y + 38, { align: "right" });

  y += 68;

  // Business info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(business.name, margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${business.address || ""} • ${business.phone || ""} • ${business.email || ""}`, margin, y);
  y += 24;

  // Received from customer
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("RECEIVED FROM:", margin + 10, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(payment.customerName || invoice.customerName, margin + 10, y + 28);
  y += 54;

  // Payment Breakdown
  const addRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(bold ? 15 : 100, bold ? 23 : 116, bold ? 42 : 139);
    doc.text(label, margin + 10, y);
    doc.text(value, pageWidth - margin - 10, y, { align: "right" });
    y += 16;
  };

  addRow("Invoice Reference", invoice.invoiceNumber);
  addRow("Payment Method", payment.paymentMethod.replace("_", " ").toUpperCase());
  if (payment.referenceNumber) {
    addRow("Transaction Ref / Check #", payment.referenceNumber);
  }
  addRow("Total Invoice Amount", formatCurrency(totals.grandTotal, currency));

  // Big Amount Box
  y += 6;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text("AMOUNT PAID:", margin + 12, y + 22);

  doc.setFontSize(14);
  doc.text(formatCurrency(payment.amount, currency), pageWidth - margin - 12, y + 22, { align: "right" });

  y += 48;
  addRow("Remaining Invoice Balance", formatCurrency(totals.remainingBalance, currency), true);

  if (payment.notes) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NOTES:", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.text(payment.notes, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text("Thank you for your prompt payment! • Smart Invoice Manager", pageWidth / 2, footerY, { align: "center" });

  return doc;
}

export function downloadReceiptPdf(
  payment: Payment,
  invoice: Invoice,
  business: BusinessProfile,
  allPayments: Payment[] = []
) {
  const doc = generateReceiptPdf(payment, invoice, business, allPayments);
  doc.save(`Receipt_${payment.receiptNumber || payment.id}.pdf`);
}
