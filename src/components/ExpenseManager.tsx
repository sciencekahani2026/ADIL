import React, { useState } from "react";
import {
  TrendingDown,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Tag,
  Calendar,
  Building2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Expense } from "../types";
import { formatCurrency } from "../utils/calculations";

export const ExpenseManager: React.FC = () => {
  const {
    currentBusiness,
    expenses,
    deleteExpense,
    modals,
    openExpenseModal,
    closeExpenseModal,
    saveExpense,
    t,
  } = useApp();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const currency = currentBusiness.currency || "USD";

  const totalExpense = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const categories = Array.from(new Set(expenses.map((e) => e.category))).filter(Boolean);

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        (e.supplier || "").toLowerCase().includes(q) ||
        (e.notes || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header & Total Card */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.expenses}</h1>
          <p className="text-xs text-slate-500">{expenses.length} expense logs</p>
        </div>
        <button
          onClick={() => openExpenseModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          {t.addExpense}
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100">
            Total Outflows
          </span>
          <div className="text-2xl font-black mt-0.5">
            {formatCurrency(totalExpense, currency)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by description, supplier, notes..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <TrendingDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">No expenses recorded</div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Log vendor payments and operational costs to calculate net income accurately.
          </p>
          <button
            onClick={() => openExpenseModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            {t.addExpense}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{exp.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>{exp.date}</span>
                    {exp.supplier && (
                      <>
                        <span>•</span>
                        <span>{exp.supplier}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">{exp.paymentMethod.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-rose-600">
                    -{formatCurrency(exp.amount, currency)}
                  </div>
                </div>
              </div>

              {exp.notes && (
                <div className="text-[11px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg">
                  "{exp.notes}"
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => openExpenseModal(exp)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  title="Edit Expense"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete expense "${exp.name}"?`)) {
                      deleteExpense(exp.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Delete Expense"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Modal */}
      {modals.expense.open && <ExpenseFormModal />}
    </div>
  );
};

const ExpenseFormModal: React.FC = () => {
  const { currentBusiness, modals, closeExpenseModal, saveExpense, t } = useApp();
  const expense = modals.expense.expense;
  const isNew = !expense;

  const [name, setName] = useState(expense?.name || "");
  const [category, setCategory] = useState(expense?.category || "Hosting & Cloud");
  const [amount, setAmount] = useState<number>(expense?.amount || 0);
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<any>(expense?.paymentMethod || "card");
  const [supplier, setSupplier] = useState(expense?.supplier || "");
  const [notes, setNotes] = useState(expense?.notes || "");

  const currency = currentBusiness.currency || "USD";

  const categories = [
    "Hosting & Cloud",
    "Software Subscriptions",
    "Utilities",
    "Office Supplies",
    "Rent & Facilities",
    "Equipment & Hardware",
    "Meals & Entertainment",
    "Travel & Transport",
    "Marketing & Advertising",
    "Salaries & Contractor",
    "Legal & Accounting",
    "Other",
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Expense name is required.");
      return;
    }
    if (amount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    saveExpense({
      id: expense?.id,
      name: name.trim(),
      category,
      amount: Number(amount),
      date,
      paymentMethod,
      supplier: supplier.trim(),
      notes: notes.trim(),
    });

    closeExpenseModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {isNew ? t.addExpense : "Edit Expense"}
            </h3>
          </div>
          <button
            onClick={closeExpenseModal}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Expense Description *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Cloud Hosting or Office Supplies"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="card">Credit / Debit Card</option>
                <option value="bank_transfer">Bank Wire</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Vendor / Supplier
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Google Cloud, Amazon, Staples"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal reference notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeExpenseModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
