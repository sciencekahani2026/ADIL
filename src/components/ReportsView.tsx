import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";

export const ReportsView: React.FC = () => {
  const { currentBusiness, invoices, payments, expenses, t } = useApp();

  const [dateFilter, setDateFilter] = useState<string>("this_month");
  const [reportType, setReportType] = useState<"summary" | "sales" | "profit" | "expenses" | "taxes" | "balances">("summary");

  const currency = currentBusiness.currency || "USD";

  // Date range filters
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const getFilteredDates = () => {
    if (dateFilter === "today") return { start: todayStr, end: todayStr };
    if (dateFilter === "this_week") {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff)).toISOString().split("T")[0];
      return { start, end: todayStr };
    }
    if (dateFilter === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      return { start, end: todayStr };
    }
    if (dateFilter === "this_year") {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      return { start, end: todayStr };
    }
    // "all"
    return { start: "2000-01-01", end: "2099-12-31" };
  };

  const { start, end } = getFilteredDates();

  // Filtered dataset
  const filteredInvoices = invoices.filter(
    (i) => i.invoiceDate >= start && i.invoiceDate <= end && i.status !== "cancelled"
  );
  const filteredPayments = payments.filter((p) => p.date >= start && p.date <= end);
  const filteredExpenses = expenses.filter((e) => e.date >= start && e.date <= end);

  // Financial aggregates
  let totalBilled = 0;
  let totalTaxCollected = 0;
  let totalDiscounts = 0;
  let totalOutstanding = 0;

  filteredInvoices.forEach((inv) => {
    const tot = calculateInvoiceTotals(inv, payments);
    totalBilled += tot.grandTotal;
    totalTaxCollected += tot.taxAmount;
    totalDiscounts += tot.discountAmount;
    totalOutstanding += tot.remainingBalance;
  });

  const totalPaymentsReceived = filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalExpensesLogged = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = totalPaymentsReceived - totalExpensesLogged;

  // Expense by category breakdown
  const expenseByCategory: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || "General";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount);
  });

  // Top Debtors
  const debtorMap: Record<string, { name: string; amount: number; count: number }> = {};
  invoices.forEach((inv) => {
    if (inv.status !== "cancelled") {
      const tot = calculateInvoiceTotals(inv, payments);
      if (tot.remainingBalance > 0) {
        if (!debtorMap[inv.customerName]) {
          debtorMap[inv.customerName] = { name: inv.customerName, amount: 0, count: 0 };
        }
        debtorMap[inv.customerName].amount += tot.remainingBalance;
        debtorMap[inv.customerName].count += 1;
      }
    }
  });
  const topDebtors = Object.values(debtorMap).sort((a, b) => b.amount - a.amount);

  // CSV Export
  const exportCsv = () => {
    let rows: string[][] = [];
    if (reportType === "sales" || reportType === "summary") {
      rows.push(["Invoice Number", "Customer", "Date", "Status", "Total", "Paid", "Balance"]);
      filteredInvoices.forEach((inv) => {
        const tot = calculateInvoiceTotals(inv, payments);
        rows.push([
          inv.invoiceNumber,
          `"${inv.customerName}"`,
          inv.invoiceDate,
          tot.effectiveStatus,
          tot.grandTotal.toString(),
          tot.amountPaid.toString(),
          tot.remainingBalance.toString(),
        ]);
      });
    } else if (reportType === "expenses") {
      rows.push(["Description", "Category", "Date", "Supplier", "Method", "Amount"]);
      filteredExpenses.forEach((exp) => {
        rows.push([
          `"${exp.name}"`,
          `"${exp.category}"`,
          exp.date,
          `"${exp.supplier || ""}"`,
          exp.paymentMethod,
          exp.amount.toString(),
        ]);
      });
    } else {
      rows.push(["Metric", "Amount"]);
      rows.push(["Total Billed", totalBilled.toString()]);
      rows.push(["Total Collected", totalPaymentsReceived.toString()]);
      rows.push(["Total Expenses", totalExpensesLogged.toString()]);
      rows.push(["Net Profit", netProfit.toString()]);
      rows.push(["Tax Collected", totalTaxCollected.toString()]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Report_${reportType}_${start}_${end}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.reports} & Analytics</h1>
          <p className="text-xs text-slate-500">Financial insights & tax auditing</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5">
          {[
            { id: "today", label: "Today" },
            { id: "this_week", label: "This Week" },
            { id: "this_month", label: "This Month" },
            { id: "this_year", label: "This Year" },
            { id: "all", label: "All Time" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === item.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Category Sub-tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "summary", label: "P&L Summary" },
          { id: "sales", label: "Sales & Invoices" },
          { id: "expenses", label: "Expense Breakdown" },
          { id: "balances", label: "Debtors & Balances" },
          { id: "taxes", label: "Tax Liability" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setReportType(item.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              reportType === item.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. Summary / P&L View */}
      {reportType === "summary" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Billed</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {formatCurrency(totalBilled, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {filteredInvoices.length} invoices issued
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Collections (Cash-In)</span>
              <div className="text-lg font-black text-emerald-600 mt-1">
                {formatCurrency(totalPaymentsReceived, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {filteredPayments.length} receipts
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Expenses (Cash-Out)</span>
              <div className="text-lg font-black text-rose-600 mt-1">
                {formatCurrency(totalExpensesLogged, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {filteredExpenses.length} expense entries
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Net Profit</span>
              <div
                className={`text-lg font-black mt-1 ${
                  netProfit >= 0 ? "text-indigo-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(netProfit, currency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Cashflow basis
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Income Statement Summary
            </h3>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Gross Sales Invoiced</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalBilled, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Discounts Conceded</span>
              <span className="font-bold text-rose-600">-{formatCurrency(totalDiscounts, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Tax Collected</span>
              <span className="font-bold text-indigo-600">+{formatCurrency(totalTaxCollected, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Operational Expenses</span>
              <span className="font-bold text-rose-600">-{formatCurrency(totalExpensesLogged, currency)}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black text-slate-900">
              <span>Net Profit (Collected - Outflows)</span>
              <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {formatCurrency(netProfit, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Expense Category Breakdown */}
      {reportType === "expenses" && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Expense Categories Breakdown
            </h3>
            {Object.keys(expenseByCategory).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No expenses in this period</div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(expenseByCategory).map(([cat, amount]) => {
                  const pct = totalExpensesLogged > 0 ? Math.round((amount / totalExpensesLogged) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{cat}</span>
                        <span className="font-bold text-rose-600">
                          {formatCurrency(amount, currency)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Debtors & Balances */}
      {reportType === "balances" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Top Customer Balances Due
            </h3>
            <span className="text-xs font-bold text-rose-600">
              Total Due: {formatCurrency(totalOutstanding, currency)}
            </span>
          </div>

          {topDebtors.length === 0 ? (
            <div className="text-center py-6 text-xs text-emerald-600 font-bold">
              ✓ All customer balances are fully settled!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topDebtors.map((d) => (
                <div key={d.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-[10px] text-slate-400">{d.count} pending invoices</div>
                  </div>
                  <div className="font-black text-rose-600">
                    {formatCurrency(d.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Taxes Report */}
      {reportType === "taxes" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Sales Tax & VAT Liability
          </h3>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-indigo-700">Total Tax Accrued</div>
              <div className="text-xl font-black text-indigo-900 mt-0.5">
                {formatCurrency(totalTaxCollected, currency)}
              </div>
            </div>
            <div className="text-right text-xs text-indigo-700">
              <div>Default Tax Rate: {currentBusiness.defaultTaxRate}%</div>
              <div>Mode: {currentBusiness.taxType}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Report ready for fiscal audit, sales tax returns, or VAT submission for business #{currentBusiness.taxNumber || "N/A"}.
          </p>
        </div>
      )}

      {/* 5. Sales & Invoices List */}
      {reportType === "sales" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
            Invoices Issued in Period ({filteredInvoices.length})
          </h3>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {filteredInvoices.map((inv) => {
              const tot = calculateInvoiceTotals(inv, payments);
              return (
                <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                    <span className="text-slate-400 text-[10px] ml-2">{inv.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(tot.grandTotal, currency)}</span>
                    <span className="text-[10px] text-slate-400 ml-2">({tot.effectiveStatus})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
