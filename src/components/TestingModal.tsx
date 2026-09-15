import React, { useState } from "react";
import { X, CheckCircle2, XCircle, Play, Calculator, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { testCalculationEngine } from "../utils/calculations";

export const TestingModal: React.FC = () => {
  const { modals, setTestingModalOpen } = useApp();
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; details: string }[]>(
    () => testCalculationEngine()
  );

  if (!modals.testing) return null;

  const handleRerun = () => {
    setTestResults(testCalculationEngine());
  };

  const allPassed = testResults.every((t) => t.passed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Financial Calculation Test Suite</h3>
              <p className="text-[10px] text-slate-500">Unit test verification for tax, discounts & balance</p>
            </div>
          </div>
          <button
            onClick={() => setTestingModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            allPassed ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold">
                  {allPassed ? "All Test Suites Passed (100%)" : "Test Failures Detected"}
                </div>
                <div className="text-[10px] opacity-80">
                  {testResults.filter((t) => t.passed).length} of {testResults.length} engine & auto-save integrity checks passed
                </div>
              </div>
            </div>

            <button
              onClick={handleRerun}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 shadow-2xs"
            >
              <Play className="w-3 h-3" /> Re-run
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {testResults.map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{t.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono pl-5.5">{t.details}</div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    t.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {t.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
