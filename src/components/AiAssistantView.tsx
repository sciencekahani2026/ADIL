import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  FileText,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { calculateInvoiceTotals } from "../utils/calculations";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const {
    currentBusiness,
    invoices,
    payments,
    expenses,
    customers,
    products,
    openInvoiceEditor,
    t,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      role: "assistant",
      content: `Hello! I am your AI Business & Invoice Assistant powered by Gemini. 

You can ask me anything about your finances, overdue payments, top customers, or ask me to **automatically generate an invoice** from a plain text description!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [naturalInvoicePrompt, setNaturalInvoicePrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingInvoice, setIsParsingInvoice] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Context payload sent to Gemini server-side endpoint
  const getFinancialContext = () => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      const tot = calculateInvoiceTotals(inv, payments);
      totalSales += tot.grandTotal;
      totalPaid += tot.amountPaid;
      totalUnpaid += tot.remainingBalance;
      if (tot.isOverdue) overdueCount += 1;
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    return {
      businessName: currentBusiness.name,
      currency: currentBusiness.currency,
      invoiceCount: invoices.length,
      customerCount: customers.length,
      productCount: products.length,
      totalSales,
      totalPaid,
      totalUnpaid,
      overdueCount,
      totalExpenses,
      netIncome: totalPaid - totalExpenses,
      recentInvoices: invoices.slice(0, 5).map((i) => ({
        number: i.invoiceNumber,
        customer: i.customerName,
        total: calculateInvoiceTotals(i, payments).grandTotal,
        status: i.status,
      })),
      recentExpenses: expenses.slice(0, 4).map((e) => ({
        name: e.name,
        amount: e.amount,
        category: e.category,
      })),
    };
  };

  // 1. Send Chat Question to Server-side Gemini API
  const handleSendMessage = async (text?: string) => {
    const query = (text || inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt("");
    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          businessContext: getFinancialContext(),
        }),
      });

      const data = await res.json();
      const reply = data.text || "I was unable to generate a response. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: "Sorry, I had trouble communicating with the server. Please check your connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Parse Natural Language into Structured Invoice using Gemini
  const handleParseInvoice = async () => {
    if (!naturalInvoicePrompt.trim() || isParsingInvoice) return;
    setIsParsingInvoice(true);

    try {
      const res = await fetch("/api/ai/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: naturalInvoicePrompt,
          businessContext: getFinancialContext(),
        }),
      });

      const data = await res.json();
      if (data && data.parsed) {
        const parsed = data.parsed;

        // Find customer if exists
        const matchedCust = customers.find(
          (c) => c.name.toLowerCase() === (parsed.customerName || "").toLowerCase()
        );

        // Pre-fill invoice editor
        openInvoiceEditor({
          customerName: parsed.customerName || "Customer",
          customerId: matchedCust ? matchedCust.id : "",
          customerEmail: matchedCust?.email || "",
          customerPhone: matchedCust?.phone || "",
          customerAddress: matchedCust?.address || "",
          items: (parsed.items || []).map((item: any) => ({
            id: "item-" + Date.now() + Math.random().toString(36).slice(2, 6),
            name: item.name || "Item",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            taxRate: currentBusiness.defaultTaxRate,
            unit: item.unit || "unit",
          })),
          discountValue: parsed.discountValue || 0,
          discountType: parsed.discountType || "percentage",
          notes: parsed.notes || "Generated via AI Assistant",
        } as any);

        setNaturalInvoicePrompt("");
      } else {
        alert("Could not extract invoice items. Please specify item names, quantities, and prices.");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing invoice with Gemini. Please try again.");
    } finally {
      setIsParsingInvoice(false);
    }
  };

  // 3. Generate Executive Summary
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch("/api/ai/business-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessContext: getFinancialContext(),
        }),
      });
      const data = await res.json();
      const summaryText = data.text || "Summary generated successfully.";

      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: `📊 **Executive Financial & Performance Summary**\n\n${summaryText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      alert("Failed to generate summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const suggestionChips = [
    "What is my net income this month?",
    "Which clients have overdue balances?",
    "Analyze my top expenses",
    "How can I improve my collection speed?",
  ];

  return (
    <div className="space-y-4 pb-20 pt-1 px-1">
      {/* Header & Feature Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Business Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Powered by Gemini API • Conversational & Generative
          </p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
        >
          {isGeneratingSummary ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BrainCircuit className="w-3.5 h-3.5" />
          )}
          Executive Summary
        </button>
      </div>

      {/* AI Smart Invoice Builder Tool Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">Natural Language Invoice Builder</h2>
            <p className="text-[10px] text-slate-500">
              Type or speak what to bill and Gemini will construct the invoice for you!
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={naturalInvoicePrompt}
            onChange={(e) => setNaturalInvoicePrompt(e.target.value)}
            placeholder="e.g. Bill Emily Watson for 20 hours of UI design at $90/hr and $150 hosting with 10% discount"
            className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleParseInvoice();
            }}
          />
          <button
            onClick={handleParseInvoice}
            disabled={isParsingInvoice || !naturalInvoicePrompt.trim()}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
          >
            {isParsingInvoice ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Build Invoice
          </button>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs whitespace-nowrap flex items-center gap-1 transition-colors"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[88%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                }`}
              >
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-xs"
                    : "bg-slate-100 text-slate-800 rounded-tl-xs whitespace-pre-line"
                }`}
              >
                {msg.content}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    msg.role === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium p-2 bg-indigo-50 rounded-xl w-fit animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              Gemini is analyzing your finances...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about sales, profits, debts, or ask for advice..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
