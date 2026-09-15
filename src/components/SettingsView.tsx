import React, { useState } from "react";
import {
  Settings,
  Building2,
  DollarSign,
  FileText,
  Palette,
  Shield,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FileCode,
  CheckCircle2,
  History,
  Printer,
  Bluetooth,
  Wifi,
  Radio,
  Sliders,
  Scissors,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { BusinessProfile, UserRole, InvoiceTemplate, TaxType, PrinterDevice, PrinterSettings, PrinterPaperWidth } from "../types";
import { supportedLanguages } from "../utils/i18n";
import {
  getSavedPrinters,
  savePrinterDevice,
  deletePrinterDevice,
  getPrinterSettings,
  savePrinterSettings,
} from "../utils/printerService";

export const SettingsView: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    setCurrentBusinessId,
    updateBusinessProfile,
    createBusiness,
    userRole,
    setUserRole,
    language,
    setLanguage,
    exportBackup,
    importBackup,
    resetData,
    auditLogs,
    openPrinterModal,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    "profile" | "language" | "invoice_defaults" | "multi_business" | "roles" | "printers" | "backup" | "audit"
  >("profile");

  // Printer Settings State
  const [printerList, setPrinterList] = useState<PrinterDevice[]>(() => getSavedPrinters());
  const [hardwareSettings, setHardwareSettings] = useState<PrinterSettings>(() => getPrinterSettings());
  const [printerSavedSuccess, setPrinterSavedSuccess] = useState(false);

  // Profile edit form state
  const [profileForm, setProfileForm] = useState<BusinessProfile>({ ...currentBusiness });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When business changes, sync form
  React.useEffect(() => {
    setProfileForm({ ...currentBusiness });
  }, [currentBusiness]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(profileForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const ok = importBackup(content);
        if (ok) {
          alert("Backup data restored successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.settings}</h1>
          <p className="text-xs text-slate-500">
            {currentBusiness.name} configuration & preferences
          </p>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "profile", label: "Business Profile", icon: Building2 },
          { id: "language", label: "Languages (" + (supportedLanguages.find(l => l.code === language)?.flag || "") + ")", icon: Globe },
          { id: "invoice_defaults", label: "Invoice Defaults", icon: FileText },
          { id: "multi_business", label: "Businesses (" + businesses.length + ")", icon: Building2 },
          { id: "roles", label: "User & Role", icon: Shield },
          { id: "printers", label: "Printers & POS", icon: Printer },
          { id: "backup", label: "Data & Backup", icon: Database },
          { id: "audit", label: "Audit Logs", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Business Profile Form */}
      {activeSubTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Company & Contact Information
            </h3>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Owner / Authorized Person
              </label>
              <input
                type="text"
                value={profileForm.ownerName}
                onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Business Phone
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Billing Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Physical Business Address
            </label>
            <input
              type="text"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tax / VAT / NTN Number
              </label>
              <input
                type="text"
                value={profileForm.taxNumber || ""}
                onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Website
              </label>
              <input
                type="text"
                value={profileForm.website || ""}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Bank / Remittance Details (Printed on Invoices)
            </label>
            <textarea
              rows={2}
              value={profileForm.paymentInfo || ""}
              onChange={(e) => setProfileForm({ ...profileForm, paymentInfo: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Standard Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={profileForm.termsAndConditions || ""}
              onChange={(e) => setProfileForm({ ...profileForm, termsAndConditions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* 1.5 Multi-Language Selection */}
      {activeSubTab === "language" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Application Language & Regional Formats
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select your preferred system language. All menus, forms, and RTL typography adapt instantly.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 flex items-center gap-1.5">
              <span className="text-sm">{supportedLanguages.find((l) => l.code === language)?.flag}</span>
              {supportedLanguages.find((l) => l.code === language)?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {supportedLanguages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between relative ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600/30"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">{l.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{l.name}</span>
                        {l.dir === "rtl" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            RTL
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{l.nativeName}</div>
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Real-time Localization
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All labels, metrics, invoices, product catalogs, customer forms, and navigation automatically adapt to your chosen language. Arabic (العربية) and Urdu (اردو) automatically activate Right-to-Left (RTL) mode.
            </p>
          </div>
        </div>
      )}

      {/* 2. Invoice Defaults & Branding */}
      {activeSubTab === "invoice_defaults" && (
        <form onSubmit={handleSaveProfile} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            Invoice Numbering, Tax & Template Preferences
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Currency Code (e.g. USD, PKR, EUR, GBP)
              </label>
              <input
                type="text"
                required
                value={profileForm.currency}
                onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={profileForm.currencySymbol}
                onChange={(e) => setProfileForm({ ...profileForm, currencySymbol: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={profileForm.defaultTaxRate}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, defaultTaxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tax Type
              </label>
              <select
                value={profileForm.taxType}
                onChange={(e: any) => setProfileForm({ ...profileForm, taxType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="exclusive">Exclusive (Added to subtotal)</option>
                <option value="inclusive">Inclusive (Embedded in unit prices)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={profileForm.invoicePrefix}
                onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Next Sequence Number
              </label>
              <input
                type="number"
                min="1"
                value={profileForm.nextInvoiceNumber}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, nextInvoiceNumber: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Default PDF Template
              </label>
              <select
                value={profileForm.defaultTemplate}
                onChange={(e: any) =>
                  setProfileForm({ ...profileForm, defaultTemplate: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 capitalize"
              >
                <option value="modern">Modern (Default)</option>
                <option value="classic">Classic</option>
                <option value="simple">Simple</option>
                <option value="professional">Professional</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profileForm.primaryColor || "#2563eb"}
                  onChange={(e) => setProfileForm({ ...profileForm, primaryColor: e.target.value })}
                  className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={profileForm.primaryColor || "#2563eb"}
                  onChange={(e) => setProfileForm({ ...profileForm, primaryColor: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              Save Default Settings
            </button>
          </div>
        </form>
      )}

      {/* 3. Multi-Business Switcher & Creator */}
      {activeSubTab === "multi_business" && (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registered Businesses ({businesses.length})
            </h3>

            <div className="space-y-2">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setCurrentBusinessId(b.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    b.id === currentBusiness.id
                      ? "border-indigo-600 bg-indigo-50/70"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center"
                      style={{ backgroundColor: b.primaryColor || "#2563eb" }}
                    >
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{b.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {b.currency} • {b.taxNumber || "No Tax ID"}
                      </div>
                    </div>
                  </div>

                  {b.id === currentBusiness.id ? (
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">Switch →</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. User Roles & Permissions */}
      {activeSubTab === "roles" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Role-Based Access Control (RBAC)
          </h3>
          <p className="text-xs text-slate-500">
            Simulate or switch between operational business roles:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { role: "owner", title: "Business Owner", desc: "Full access to settings, financials, deleting records, and tax reports." },
              { role: "admin", title: "Administrator", desc: "Manage invoices, customers, inventory, and staff operations." },
              { role: "accountant", title: "Accountant", desc: "Access reports, payments, and expenses. Cannot alter business profile." },
              { role: "salesperson", title: "Salesperson", desc: "Can create and issue invoices and add customers." },
              { role: "employee", title: "Staff / Employee", desc: "Read-only access to customer listings and inventory catalog." },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => setUserRole(item.role as UserRole)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  userRole === item.role
                    ? "border-indigo-600 bg-indigo-50/70 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  {userRole === item.role && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Data & Backup */}
      {activeSubTab === "backup" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Backup, Restore & Reset
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Export JSON Database Backup</div>
                <div className="text-[11px] text-slate-500">
                  Save all businesses, customers, products, and invoices to an offline JSON file.
                </div>
              </div>
              <button
                onClick={exportBackup}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Restore Database Backup</div>
                <div className="text-[11px] text-slate-500">
                  Upload a previously exported Smart Invoice Manager JSON file.
                </div>
              </div>
              <label className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                Import
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-rose-800">Reset to Sample Demo Data</div>
                <div className="text-[11px] text-rose-600">
                  Restores default businesses, sample customers, products, and invoices.
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Reset all data to default demo state?")) {
                    resetData();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Printers & Hardware POS */}
      {activeSubTab === "printers" && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  Thermal Printer & Hardware Settings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Connect via Bluetooth, Hotspot Wi-Fi (IP 9100), or System Thermal drivers
                </p>
              </div>

              <button
                type="button"
                id="settings-open-printer-modal-btn"
                onClick={() => openPrinterModal()}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                Connect & Test
              </button>
            </div>

            {printerSavedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Printer configuration saved successfully!
              </div>
            )}

            {/* Saved Printers List */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Registered Hardware Devices ({printerList.length})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {printerList.map((printer) => (
                  <div
                    key={printer.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      printer.isDefault
                        ? "bg-indigo-50/60 border-indigo-200 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          printer.type === "bluetooth"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {printer.type === "bluetooth" ? (
                          <Bluetooth className="w-4 h-4" />
                        ) : (
                          <Wifi className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{printer.name}</span>
                          {printer.isDefault && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {printer.type === "bluetooth"
                            ? `BLE Thermal • ${printer.paperWidth}`
                            : `${printer.ipAddress}:${printer.port || 9100} • ${printer.paperWidth}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!printer.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = printerList.map((p) => ({
                              ...p,
                              isDefault: p.id === printer.id,
                            }));
                            setPrinterList(updated);
                            savePrinterDevice({ ...printer, isDefault: true });
                          }}
                          className="text-[10px] text-slate-500 hover:text-indigo-600 font-semibold px-1.5 py-1"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deletePrinterDevice(printer.id);
                          setPrinterList(getSavedPrinters());
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Settings Form */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Default Paper Roll Width
                  </label>
                  <select
                    value={hardwareSettings.defaultPaperWidth}
                    onChange={(e: any) =>
                      setHardwareSettings({
                        ...hardwareSettings,
                        defaultPaperWidth: e.target.value as PrinterPaperWidth,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="58mm">58 mm (2-Inch) Mobile Receipt Roll</option>
                    <option value="80mm">80 mm (3-Inch) Standard POS / Kitchen Roll</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Hotspot Printer Subnet IP
                  </label>
                  <input
                    type="text"
                    value={hardwareSettings.hotspotIpAddress}
                    onChange={(e) =>
                      setHardwareSettings({
                        ...hardwareSettings,
                        hotspotIpAddress: e.target.value,
                      })
                    }
                    placeholder="192.168.43.100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hardwareSettings.autoCutPaper}
                    onChange={(e) =>
                      setHardwareSettings({
                        ...hardwareSettings,
                        autoCutPaper: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-slate-500" />
                    Auto-Cut Paper
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hardwareSettings.kickCashDrawer}
                    onChange={(e) =>
                      setHardwareSettings({
                        ...hardwareSettings,
                        kickCashDrawer: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Cash Drawer Pulse
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Custom Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={hardwareSettings.footerReceiptText || ""}
                  onChange={(e) =>
                    setHardwareSettings({
                      ...hardwareSettings,
                      footerReceiptText: e.target.value,
                    })
                  }
                  placeholder="Thank you for shopping with us! Return within 7 days with receipt."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openPrinterModal(undefined, undefined, "bluetooth")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs"
                >
                  Pair New Bluetooth Printer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    savePrinterSettings(hardwareSettings);
                    setPrinterSavedSuccess(true);
                    setTimeout(() => setPrinterSavedSuccess(false), 2500);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  Save Hardware Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Audit Trail */}
      {activeSubTab === "audit" && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            System & Security Audit Trail ({auditLogs.length})
          </h3>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  User: {log.userName} ({log.userRole})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
