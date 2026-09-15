import React from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileEdit,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Plus,
  PackageCheck,
  ChevronRight,
  Receipt,
  Users,
  Package,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "../utils/calculations";

export const Dashboard: React.FC = () => {
  const {
    currentBusiness,
    invoices,
    payments,
    expenses,
    products,
    customers,
    t,
    setActiveTab,
    openInvoiceEditor,
    openCustomerModal,
    openProductModal,
    openPaymentModal,
    openExpenseModal,
    openInvoiceDetails,
  } = useApp();

  const currency = currentBusiness.currency || "USD";

  // Compute overall financial metrics
  let totalSales = 0;
  let paidTotal = 0;
  let unpaidTotal = 0;
  let overdueTotal = 0;
  let overdueCount = 0;
  let draftTotal = 0;
  let draftCount = 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split("T")[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  let todaySales = 0;
  let thisWeekSales = 0;
  let thisMonthSales = 0;

  invoices.forEach((inv) => {
    const totals = calculateInvoiceTotals(inv, payments);
    if (inv.status !== "cancelled") {
      totalSales += totals.grandTotal;
      paidTotal += totals.amountPaid;
      unpaidTotal += totals.remainingBalance;

      if (totals.isOverdue) {
        overdueTotal += totals.remainingBalance;
        overdueCount += 1;
      }
      if (inv.status === "draft") {
        draftTotal += totals.grandTotal;
        draftCount += 1;
      }

      if (inv.invoiceDate === todayStr) {
        todaySales += totals.grandTotal;
      }
      if (inv.invoiceDate >= startOfWeek) {
        thisWeekSales += totals.grandTotal;
      }
      if (inv.invoiceDate >= startOfMonth) {
        thisMonthSales += totals.grandTotal;
      }
    }
  });

  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netIncome = paidTotal - totalExpenses;

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.type === "product" && p.stockQuantity <= p.lowStockThreshold
  );

  // Status mapping colors
  const statusStyles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partially_paid: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    viewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="space-y-4 pb-20 pt-1 px-1">
      {/* Welcome & Net Income Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">
              {currentBusiness.name}
            </span>
            <h1 className="text-xl font-black tracking-tight mt-0.5">{t.netIncome}</h1>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-indigo-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Metrics
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight">
            {formatCurrency(netIncome, currency)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            netIncome >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
          }`}>
            {netIncome >= 0 ? "Profitable" : "Deficit"}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-left">
          <div>
            <div className="text-[10px] text-indigo-200/70 font-medium">{t.todaySales}</div>
            <div className="text-xs font-bold text-white mt-0.5">{formatCurrency(todaySales, currency)}</div>
          </div>
          <div>
            <div className="text-[10px] text-indigo-200/70 font-medium">{t.thisWeekSales}</div>
            <div className="text-xs font-bold text-white mt-0.5">{formatCurrency(thisWeekSales, currency)}</div>
          </div>
          <div>
            <div className="text-[10px] text-indigo-200/70 font-medium">{t.thisMonthSales}</div>
            <div className="text-xs font-bold text-white mt-0.5">{formatCurrency(thisMonthSales, currency)}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Button Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => openInvoiceEditor()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm whitespace-nowrap transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          {t.createInvoice}
        </button>
        <button
          onClick={() => openCustomerModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs whitespace-nowrap transition-all active:scale-95"
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          {t.addCustomer}
        </button>
        <button
          onClick={() => openProductModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs whitespace-nowrap transition-all active:scale-95"
        >
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          {t.addProduct}
        </button>
        <button
          onClick={() => openPaymentModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs whitespace-nowrap transition-all active:scale-95"
        >
          <Receipt className="w-3.5 h-3.5 text-violet-600" />
          {t.recordPayment}
        </button>
        <button
          onClick={() => openExpenseModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs whitespace-nowrap transition-all active:scale-95"
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          {t.addExpense}
        </button>
      </div>

      {/* Overdue Warning Alert Banner */}
      {overdueCount > 0 && (
        <div
          onClick={() => setActiveTab("invoices")}
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">
                {overdueCount} {t.overdueInvoices} ({formatCurrency(overdueTotal, currency)})
              </div>
              <div className="text-[11px] text-rose-600">Past due date — tap to review and send reminders</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-500" />
        </div>
      )}

      {/* Low Stock Warning Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div
          onClick={() => setActiveTab("products")}
          className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">
                {lowStockProducts.length} {t.lowStockAlert}
              </div>
              <div className="text-[11px] text-amber-700">
                {lowStockProducts.map((p) => p.name).slice(0, 2).join(", ")}
                {lowStockProducts.length > 2 ? ` and ${lowStockProducts.length - 2} more` : ""}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </div>
      )}

      {/* Core Financial KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Sales Invoiced */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t.totalSales}</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-800 mt-1">
            {formatCurrency(totalSales, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {invoices.length} total invoices issued
          </div>
        </div>

        {/* Paid Volume */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t.paidInvoices}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 mt-1">
            {formatCurrency(paidTotal, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {totalSales > 0 ? `${Math.round((paidTotal / totalSales) * 100)}% collected` : "0% collected"}
          </div>
        </div>

        {/* Unpaid / Outstanding */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t.unpaidInvoices}</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 mt-1">
            {formatCurrency(unpaidTotal, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Awaiting customer payment
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t.totalExpenses}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-black text-rose-600 mt-1">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {expenses.length} logged business outflows
          </div>
        </div>
      </div>

      {/* Cash Flow Distribution Progress Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span>Cash Flow Breakdown</span>
          <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer" onClick={() => setActiveTab("reports")}>
            Full Reports →
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-100 flex overflow-hidden gap-0.5">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${totalSales > 0 ? (paidTotal / (totalSales + totalExpenses)) * 100 : 50}%` }}
            title={`Paid: ${formatCurrency(paidTotal, currency)}`}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{ width: `${totalSales > 0 ? (unpaidTotal / (totalSales + totalExpenses)) * 100 : 25}%` }}
            title={`Unpaid: ${formatCurrency(unpaidTotal, currency)}`}
          />
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${totalExpenses > 0 ? (totalExpenses / (totalSales + totalExpenses)) * 100 : 25}%` }}
            title={`Expenses: ${formatCurrency(totalExpenses, currency)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Collected ({formatCurrency(paidTotal, currency)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Pending ({formatCurrency(unpaidTotal, currency)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Outflow ({formatCurrency(totalExpenses, currency)})</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Callout Card */}
      <div
        onClick={() => setActiveTab("ai-assistant")}
        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
              <span>Gemini AI Business Assistant</span>
              <span className="text-[9px] bg-white/25 px-1.5 py-0.5 rounded font-bold">PRO</span>
            </div>
            <p className="text-[11px] text-white/90 mt-0.5">
              Ask questions about sales, auto-create invoices from text, or generate executive summaries.
            </p>
          </div>
        </div>
        <ArrowUpRight className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.recentInvoices}</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {invoices.length}
            </span>
          </div>
          <button
            onClick={() => setActiveTab("invoices")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {t.viewAll} →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {invoices.slice(0, 5).map((inv) => {
            const totals = calculateInvoiceTotals(inv, payments);
            const statusClass = statusStyles[totals.effectiveStatus] || "bg-slate-100 text-slate-700";

            return (
              <div
                key={inv.id}
                onClick={() => openInvoiceDetails(inv)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-1 px-1 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {inv.invoiceNumber.slice(-3)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{inv.invoiceNumber}</span>
                      <span className="text-slate-400 font-normal">•</span>
                      <span className="font-semibold text-slate-600 truncate max-w-[130px] sm:max-w-[180px]">
                        {inv.customerName}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {inv.invoiceDate} • Due {inv.dueDate || "Receipt"}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-slate-800">
                    {formatCurrency(totals.grandTotal, currency)}
                  </div>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${statusClass}`}>
                    {totals.effectiveStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
