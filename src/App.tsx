import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { InvoicesList } from "./components/InvoicesList";
import { InvoiceEditor } from "./components/InvoiceEditor";
import { InvoiceDetailsModal } from "./components/InvoiceDetailsModal";
import { ShareModal } from "./components/ShareModal";
import { CustomerManager } from "./components/CustomerManager";
import { ProductManager } from "./components/ProductManager";
import { PaymentManager } from "./components/PaymentManager";
import { ExpenseManager } from "./components/ExpenseManager";
import { ReportsView } from "./components/ReportsView";
import { AiAssistantView } from "./components/AiAssistantView";
import { SettingsView } from "./components/SettingsView";
import { FlutterExportModal } from "./components/FlutterExportModal";
import { TestingModal } from "./components/TestingModal";
import { PrinterModal } from "./components/PrinterModal";

const MainAppLayout: React.FC = () => {
  const { activeTab, direction, language, isPhoneFrame } = useApp();
  const isRtl = direction === "rtl";
  const fontClass =
    language === "ur"
      ? "font-urdu"
      : language === "ar"
      ? "font-arabic"
      : language === "hi"
      ? "font-hindi"
      : "";

  return (
    <div
      className={`min-h-screen bg-slate-200/70 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white py-0 ${
        isPhoneFrame ? "sm:py-4" : ""
      } ${isRtl ? "rtl" : "ltr"} ${fontClass}`}
      dir={direction}
    >
      {/* Centered responsive shell mimicking mobile/tablet or fluid layout */}
      <div
        className={`mx-auto bg-slate-50 min-h-screen shadow-2xl flex flex-col relative transition-all duration-300 ${
          isPhoneFrame
            ? "max-w-md sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 sm:min-h-[850px] overflow-hidden"
            : "max-w-4xl border-x border-slate-200"
        }`}
      >
        {/* Navigation Bar (Top + Bottom) */}
        <Navigation />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 p-3 sm:p-4 max-w-full overflow-x-hidden">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "invoices" && <InvoicesList />}
          {activeTab === "customers" && <CustomerManager />}
          {activeTab === "products" && <ProductManager />}
          {activeTab === "payments" && <PaymentManager />}
          {activeTab === "expenses" && <ExpenseManager />}
          {activeTab === "reports" && <ReportsView />}
          {activeTab === "ai-assistant" && <AiAssistantView />}
          {activeTab === "settings" && <SettingsView />}
        </main>

        {/* Global Modals & Overlays */}
        <InvoiceEditor />
        <InvoiceDetailsModal />
        <ShareModal />
        <PrinterModal />
        <FlutterExportModal />
        <TestingModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}
