import { jsPDF } from "jspdf";
import { BusinessProfile, Invoice, Payment } from "../types";
import { calculateInvoiceTotals, formatCurrency } from "./calculations";

export function generateInvoicePdf(
  invoice: Invoice,
  business: BusinessProfile,
  payments: Payment[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const totals = calculateInvoiceTotals(invoice, payments);
  const template = invoice.template || business.defaultTemplate || "modern";
  const currency = business.currency || "USD";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Primary color based on business theme or template
  let primaryR = 37;
  let primaryG = 99;
  let primaryB = 235; // default indigo/blue

  if (business.primaryColor && business.primaryColor.startsWith("#")) {
    const hex = business.primaryColor.replace("#", "");
    if (hex.length === 6) {
      primaryR = parseInt(hex.substring(0, 2), 16);
      primaryG = parseInt(hex.substring(2, 4), 16);
      primaryB = parseInt(hex.substring(4, 6), 16);
    }
  }

  let y = margin;

  // 1. HEADER SECTION
  if (template === "modern") {
    // Modern: Top colored accent bar
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(0, 0, pageWidth, 12, "F");

    y = 50;
    // Business title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(business.name, margin, y);

    // Invoice badge
    doc.setFontSize(24);
    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.text("INVOICE", pageWidth - margin, y, { align: "right" });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    if (business.address) {
      doc.text(business.address, margin, y);
      y += 12;
    }
    const bizContact = [business.phone, business.email, business.website].filter(Boolean).join(" • ");
    if (bizContact) {
      doc.text(bizContact, margin, y);
      y += 12;
    }
    if (business.taxNumber) {
      doc.text(`Tax/VAT ID: ${business.taxNumber}`, margin, y);
      y += 12;
    }

    // Right side invoice details
    let rightY = 68;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin, rightY, { align: "right" });
    rightY += 14;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin, rightY, { align: "right" });
    rightY += 14;
    doc.text(`Due Date: ${invoice.dueDate || "Due on Receipt"}`, pageWidth - margin, rightY, { align: "right" });
    rightY += 14;
    doc.text(`Status: ${totals.effectiveStatus.toUpperCase().replace("_", " ")}`, pageWidth - margin, rightY, { align: "right" });

    y = Math.max(y, rightY) + 20;
  } else if (template === "classic") {
    y = 50;
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    doc.text(business.name, margin, y);

    doc.setFontSize(22);
    doc.text("INVOICE", pageWidth - margin, y, { align: "right" });
    y += 14;

    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (business.address) {
      doc.text(business.address, margin, y);
      y += 14;
    }
    doc.text(`Phone: ${business.phone || "N/A"} | Email: ${business.email || "N/A"}`, margin, y);
    y += 14;

    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, pageWidth - margin, 85, { align: "right" });
    doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin, 99, { align: "right" });
    doc.text(`Due: ${invoice.dueDate || "Upon receipt"}`, pageWidth - margin, 113, { align: "right" });
    y += 15;
  } else if (template === "compact") {
    y = 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.text(business.name, margin, y);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`INVOICE ${invoice.invoiceNumber}`, pageWidth - margin, y, { align: "right" });
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(`${business.phone || ""} | ${business.email || ""} | ${business.address || ""}`, margin, y);
    doc.text(`Date: ${invoice.invoiceDate} | Due: ${invoice.dueDate || "Upon Receipt"}`, pageWidth - margin, y, { align: "right" });
    y += 18;
  } else {
    // Professional & Simple default
    y = 45;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y - 10, contentWidth, 75, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.text(business.name, margin + 14, y + 16);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${business.phone || ""} • ${business.email || ""} • ${business.address || ""}`, margin + 14, y + 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("INVOICE", pageWidth - margin - 14, y + 16, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`#${invoice.invoiceNumber}  •  ${invoice.invoiceDate}`, pageWidth - margin - 14, y + 32, { align: "right" });
    doc.text(`Due: ${invoice.dueDate || "Upon Receipt"}`, pageWidth - margin - 14, y + 46, { align: "right" });

    y += 85;
  }

  // 2. BILL TO SECTION
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.text("BILL TO / CUSTOMER:", margin + 12, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.customerName || "Valued Customer", margin + 12, y + 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const custDetails = [
    invoice.customerEmail,
    invoice.customerPhone,
    invoice.customerAddress,
  ].filter(Boolean).join("  •  ");
  if (custDetails) {
    doc.text(custDetails, margin + 12, y + 45);
  }

  y += 70;

  // 3. ITEMS TABLE
  // Table Header
  const colX = {
    item: margin + 10,
    qty: margin + contentWidth - 230,
    price: margin + contentWidth - 160,
    tax: margin + contentWidth - 95,
    total: margin + contentWidth - 10,
  };

  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(margin, y, contentWidth, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM & DESCRIPTION", colX.item, y + 15);
  doc.text("QTY", colX.qty, y + 15, { align: "right" });
  doc.text("PRICE", colX.price, y + 15, { align: "right" });
  doc.text("TAX", colX.tax, y + 15, { align: "right" });
  doc.text("AMOUNT", colX.total, y + 15, { align: "right" });

  y += 24;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  invoice.items.forEach((item, index) => {
    // alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 24, "F");
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(item.name || "Item", colX.item, y + 15);

    doc.setFont("helvetica", "normal");
    doc.text(`${item.quantity} ${item.unit || ""}`.trim(), colX.qty, y + 15, { align: "right" });
    doc.text(formatCurrency(item.unitPrice, currency), colX.price, y + 15, { align: "right" });
    doc.text(`${item.taxRate || 0}%`, colX.tax, y + 15, { align: "right" });

    const lineTotal = item.quantity * item.unitPrice;
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(lineTotal, currency), colX.total, y + 15, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 24, margin + contentWidth, y + 24);

    y += 24;

    // Optional item description
    if (item.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(item.description, colX.item + 8, y + 12);
      y += 16;
    }

    // Page break handling
    if (y > pageHeight - 160) {
      doc.addPage();
      y = margin;
    }
  });

  y += 15;

  // 4. SUMMARY & TOTALS SECTION
  const summaryWidth = 240;
  const summaryX = pageWidth - margin - summaryWidth;

  // Notes & Payment instructions on left
  const notesWidth = contentWidth - summaryWidth - 20;
  let notesY = y;

  if (invoice.notes || business.paymentInfo || invoice.terms) {
    if (invoice.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("NOTES:", margin, notesY);
      notesY += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
      doc.text(splitNotes, margin, notesY);
      notesY += splitNotes.length * 10 + 8;
    }

    if (business.paymentInfo || invoice.paymentInstructions) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("PAYMENT INSTRUCTIONS:", margin, notesY);
      notesY += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const paymentText = invoice.paymentInstructions || business.paymentInfo;
      const splitPay = doc.splitTextToSize(paymentText, notesWidth);
      doc.text(splitPay, margin, notesY);
      notesY += splitPay.length * 10 + 8;
    }

    if (invoice.terms || business.termsAndConditions) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("TERMS & CONDITIONS:", margin, notesY);
      notesY += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const termsText = invoice.terms || business.termsAndConditions;
      const splitTerms = doc.splitTextToSize(termsText, notesWidth);
      doc.text(splitTerms, margin, notesY);
    }
  }

  // Right summary block
  let sumY = y;
  doc.setFontSize(9);

  const addSummaryRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 30 : 100, bold ? 41 : 116, bold ? 59 : 139);
    doc.text(label, summaryX, sumY);
    doc.text(value, pageWidth - margin, sumY, { align: "right" });
    sumY += 16;
  };

  addSummaryRow("Subtotal", formatCurrency(totals.subtotal, currency));

  if (totals.discountAmount > 0) {
    addSummaryRow(
      `Discount (${invoice.discountType === "percentage" ? `${invoice.discountValue}%` : "Fixed"})`,
      `-${formatCurrency(totals.discountAmount, currency)}`
    );
  }

  if (totals.taxAmount > 0) {
    addSummaryRow(
      `Tax (${invoice.taxType === "inclusive" ? "Included" : "Added"})`,
      formatCurrency(totals.taxAmount, currency)
    );
  }

  if (totals.shipping > 0) {
    addSummaryRow("Shipping", formatCurrency(totals.shipping, currency));
  }

  if (totals.additionalCharges > 0) {
    addSummaryRow("Additional Charges", formatCurrency(totals.additionalCharges, currency));
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, sumY - 4, pageWidth - margin, sumY - 4);
  sumY += 6;

  // Grand Total Box
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.roundedRect(summaryX, sumY - 6, summaryWidth, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", summaryX + 10, sumY + 11);
  doc.text(formatCurrency(totals.grandTotal, currency), pageWidth - margin - 10, sumY + 11, { align: "right" });
  sumY += 34;

  // Paid & Balance
  if (totals.amountPaid > 0) {
    addSummaryRow("Amount Paid", formatCurrency(totals.amountPaid, currency));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(totals.remainingBalance > 0 ? 220 : 16, totals.remainingBalance > 0 ? 38 : 149, totals.remainingBalance > 0 ? 38 : 74);
    doc.text("Remaining Balance", summaryX, sumY);
    doc.text(formatCurrency(totals.remainingBalance, currency), pageWidth - margin, sumY, { align: "right" });
    sumY += 18;
  }

  // 5. FOOTER
  const footerY = pageHeight - 25;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by Smart Invoice Manager • Thank you for your business!`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePdf(invoice: Invoice, business: BusinessProfile, payments: Payment[] = []) {
  const doc = generateInvoicePdf(invoice, business, payments);
  const cleanNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  doc.save(`Invoice_${cleanNum}.pdf`);
}

export function printInvoicePdf(invoice: Invoice, business: BusinessProfile, payments: Payment[] = []) {
  const doc = generateInvoicePdf(invoice, business, payments);
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = blobUrl.toString();
  document.body.appendChild(iframe);
}
