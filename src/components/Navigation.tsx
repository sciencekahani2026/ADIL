import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  MoreHorizontal,
  Plus,
  Bell,
  Building2,
  Sparkles,
  CreditCard,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  CheckCircle2,
  Smartphone,
  Monitor,
  Globe,
  ShieldCheck,
  Code2,
  Calculator,
  ChevronDown,
  Check,
} from "lucide-react";
import { useApp, NavTab } from "../context/AppContext";
import { UserRole } from "../types";
import { supportedLanguages } from "../utils/i18n";

export const Navigation: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    setCurrentBusinessId,
    activeTab,
    setActiveTab,
    notifications,
    markNotificationRead,
    language,
    setLanguage,
    userRole,
    setUserRole,
    isPhoneFrame,
    setIsPhoneFrame,
    t,
    openInvoiceEditor,
    openCustomerModal,
    openProductModal,
    openPaymentModal,
    openExpenseModal,
    setTestingModalOpen,
    setFlutterExportModalOpen,
  } = useApp();

  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Admin",
    accountant: "Accountant",
    salesperson: "Sales",
    employee: "Employee",
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 py-2.5 flex items-center justify-between">
        {/* Left: Business Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ backgroundColor: currentBusiness.primaryColor || "#2563eb" }}
            >
              {currentBusiness.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden min-[380px]:block">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1 leading-tight">
                <span className="truncate max-w-[130px] sm:max-w-[200px]">{currentBusiness.name}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentBusiness.currency} • {roleLabels[userRole]}
              </div>
            </div>
          </button>

          {/* Business Switcher Dropdown */}
          {showBusinessDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Switch Business
              </div>
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  onClick={() => {
                    setCurrentBusinessId(biz.id);
                    setShowBusinessDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                    biz.id === currentBusiness.id ? "bg-indigo-50 text-indigo-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center"
                      style={{ backgroundColor: biz.primaryColor || "#2563eb" }}
                    >
                      {biz.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{biz.name}</div>
                      <div className="text-[10px] text-slate-500">{biz.currency} • {biz.taxNumber || "No Tax ID"}</div>
                    </div>
                  </div>
                  {biz.id === currentBusiness.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}

              <div className="border-t border-slate-100 my-1 pt-1">
                <button
                  onClick={() => {
                    setShowBusinessDropdown(false);
                    setActiveTab("settings");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Manage / Add Businesses
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick toggles (Flutter Export, Tests, Language, Phone Frame, Notifications) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Flutter Architecture Export Button */}
          <button
            onClick={() => setFlutterExportModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors"
            title="View Flutter & Dart Project Architecture"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Flutter Code</span>
          </button>

          {/* Unit Testing Suite Button */}
          <button
            onClick={() => setTestingModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Run Calculation Unit Tests"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            {(() => {
              const currentLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];
              return (
                <>
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Change Language"
                  >
                    <span className="text-xs">{currentLang.flag}</span>
                    <span className="uppercase">{currentLang.code}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showLangMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLangMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          Select Language
                        </div>
                        <div className="space-y-0.5 max-h-64 overflow-y-auto">
                          {supportedLanguages.map((l) => {
                            const isSelected = language === l.code;
                            return (
                              <button
                                key={l.code}
                                onClick={() => {
                                  setLanguage(l.code);
                                  setShowLangMenu(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                                  isSelected
                                    ? "bg-indigo-50 text-indigo-700 font-bold"
                                    : "text-slate-700 hover:bg-slate-50 font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{l.flag}</span>
                                  <div className="text-left">
                                    <div className="text-xs text-slate-800">{l.name}</div>
                                    <div className="text-[10px] text-slate-400">{l.nativeName}</div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* Mobile Frame View Toggle */}
          <button
            onClick={() => setIsPhoneFrame((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title={isPhoneFrame ? "Switch to Wide Responsive View" : "Switch to Mobile Phone Frame View"}
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4 text-indigo-600" /> : <Smartphone className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Notifications ({notifications.length})</span>
                  <span className="text-[10px] text-indigo-600 font-medium cursor-pointer">Live Updates</span>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No new alerts</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.linkTab) setActiveTab(n.linkTab as NavTab);
                          setShowNotifications(false);
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                          n.read ? "bg-slate-50 border-slate-100 opacity-70" : "bg-white border-slate-200 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${
                            n.type === "danger" ? "text-red-600" : n.type === "warning" ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-400">{n.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Action FAB Bottom Sheet */}
      {showQuickActions && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">{t.quickActions}</span>
              <button
                onClick={() => setShowQuickActions(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  setShowQuickActions(false);
                  openInvoiceEditor();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.createInvoice}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  openCustomerModal();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100 border border-blue-100 text-blue-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.addCustomer}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  openProductModal();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.addProduct}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  openPaymentModal();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-violet-50/80 hover:bg-violet-100 border border-violet-100 text-violet-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.recordPayment}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  openExpenseModal();
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-50/80 hover:bg-rose-100 border border-rose-100 text-rose-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-sm">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.addExpense}</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickActions(false);
                  setActiveTab("ai-assistant");
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100 border border-amber-100 text-amber-700 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">{t.aiAssistant}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "More" Drawer / Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">{t.more} Tools & Sections</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => {
                  setActiveTab("payments");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{t.payments}</div>
                  <div className="text-[10px] text-slate-400">Tracking & Receipts</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("expenses");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{t.expenses}</div>
                  <div className="text-[10px] text-slate-400">Outflows & Suppliers</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("reports");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{t.reports}</div>
                  <div className="text-[10px] text-slate-400">Sales, Tax & Profit</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("ai-assistant");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{t.aiAssistant}</div>
                  <div className="text-[10px] text-slate-400">Gemini Powered</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-slate-700" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{t.settings}</div>
                  <div className="text-[10px] text-slate-400">Profile, Tax & Backup</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setFlutterExportModalOpen(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors text-left"
              >
                <Code2 className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-emerald-800">Flutter Architecture</div>
                  <div className="text-[10px] text-emerald-600">Dart, Firebase, Rules</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Material 3 with Center Floating Action Button) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 flex flex-col items-center py-1 transition-colors ${
              activeTab === "dashboard" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.dashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex-1 flex flex-col items-center py-1 transition-colors ${
              activeTab === "invoices" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.invoices}</span>
          </button>

          {/* Center Floating Action Button */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={() => setShowQuickActions(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-white"
              title="Quick Actions"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab("customers")}
            className={`flex-1 flex flex-col items-center py-1 transition-colors ${
              activeTab === "customers" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.customers}</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex-1 flex flex-col items-center py-1 transition-colors ${
              ["payments", "expenses", "reports", "ai-assistant", "settings"].includes(activeTab)
                ? "text-indigo-600 font-bold"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.more}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
