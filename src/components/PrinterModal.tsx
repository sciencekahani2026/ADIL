import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Bluetooth,
  Wifi,
  Radio,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  DollarSign,
  Scissors,
  Smartphone,
  Server,
  FileText,
  Copy,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Invoice,
  Payment,
  PrinterConnectionType,
  PrinterPaperWidth,
  PrinterDevice,
  PrinterProtocol,
} from "../types";
import {
  generateThermalReceiptText,
  generateThermalPaymentReceiptText,
  generateTestReceiptText,
  buildEscPosBinary,
} from "../utils/escposGenerator";
import {
  getSavedPrinters,
  savePrinterDevice,
  getPrinterSettings,
  savePrinterSettings,
  isWebBluetoothSupported,
  requestBluetoothPrinter,
  connectBluetoothDevice,
  sendBluetoothBytes,
  testHotspotPrinterConnection,
  sendHotspotPrintJob,
  printThermalReceiptViaBrowser,
} from "../utils/printerService";

interface PrinterModalProps {
  // Can be controlled via AppContext or standalone props
  isOpen?: boolean;
  onClose?: () => void;
  invoice?: Invoice;
  payment?: Payment;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  invoice: propInvoice,
  payment: propPayment,
}) => {
  const {
    currentBusiness,
    payments,
    modals,
    closePrinterModal,
    t,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : modals.printer?.open;
  const onClose = propOnClose || closePrinterModal;
  const invoice = propInvoice || modals.printer?.invoice;
  const payment = propPayment || modals.printer?.payment;

  // Active printer tab
  const [activeTab, setActiveTab] = useState<PrinterConnectionType>(
    modals.printer?.defaultMode || "bluetooth"
  );

  // Configuration
  const [paperWidth, setPaperWidth] = useState<PrinterPaperWidth>("58mm");
  const [autoCut, setAutoCut] = useState(true);
  const [kickCashDrawer, setKickCashDrawer] = useState(false);

  // Bluetooth State
  const [bluetoothSupported, setBluetoothSupported] = useState(true);
  const [bluetoothStatus, setBluetoothStatus] = useState<
    "disconnected" | "scanning" | "connecting" | "connected" | "error"
  >("disconnected");
  const [connectedBleDeviceName, setConnectedBleDeviceName] = useState<string | null>(
    "Mobile Bluetooth POS-58"
  );
  const [bleError, setBleError] = useState<string | null>(null);

  // Hotspot / Wi-Fi State
  const [hotspotIp, setHotspotIp] = useState("192.168.43.100");
  const [hotspotPort, setHotspotPort] = useState(9100);
  const [hotspotProtocol, setHotspotProtocol] = useState<PrinterProtocol>("raw9100");
  const [testingHotspot, setTestingHotspot] = useState(false);
  const [hotspotTestResult, setHotspotTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Print execution feedback
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<"document" | "test">("document");

  // Load saved printer configuration
  useEffect(() => {
    if (isOpen) {
      setBluetoothSupported(isWebBluetoothSupported());
      const settings = getPrinterSettings();
      setPaperWidth(settings.defaultPaperWidth || "58mm");
      setAutoCut(settings.autoCutPaper ?? true);
      setKickCashDrawer(settings.kickCashDrawer ?? false);
      setHotspotIp(settings.hotspotIpAddress || "192.168.43.100");
      setHotspotPort(settings.hotspotPort || 9100);
      setHotspotProtocol(settings.hotspotProtocol || "raw9100");
      setPrintFeedback(null);
      setHotspotTestResult(null);

      // Check saved default printer
      const saved = getSavedPrinters();
      const defaultP = saved.find((p) => p.isDefault) || saved[0];
      if (defaultP) {
        if (!modals.printer?.defaultMode) {
          setActiveTab(defaultP.type);
        }
        if (defaultP.type === "bluetooth") {
          setConnectedBleDeviceName(defaultP.name);
          setBluetoothStatus("connected");
        } else if (defaultP.type === "hotspot" && defaultP.ipAddress) {
          setHotspotIp(defaultP.ipAddress);
          if (defaultP.port) setHotspotPort(defaultP.port);
        }
      }
    }
  }, [isOpen, modals.printer?.defaultMode]);

  if (!isOpen) return null;

  // Generate Receipt Content
  const getReceiptText = (): string => {
    if (previewMode === "test") {
      const devName =
        activeTab === "bluetooth"
          ? connectedBleDeviceName || "Bluetooth POS-58"
          : activeTab === "hotspot"
          ? `Hotspot (${hotspotIp}:${hotspotPort})`
          : "System Printer";
      return generateTestReceiptText(devName, activeTab, paperWidth);
    }

    if (payment && invoice) {
      return generateThermalPaymentReceiptText(payment, invoice, currentBusiness, payments, {
        paperWidth,
        autoCut,
        openCashDrawer: kickCashDrawer,
      });
    }

    if (invoice) {
      return generateThermalReceiptText(invoice, currentBusiness, payments, {
        paperWidth,
        autoCut,
        openCashDrawer: kickCashDrawer,
      });
    }

    // Default sample if opened without an invoice
    return generateTestReceiptText("Smart Invoice POS", activeTab, paperWidth);
  };

  const receiptText = getReceiptText();

  // ==========================================
  // BLUETOOTH ACTIONS
  // ==========================================

  const handleScanBluetooth = async () => {
    setBleError(null);
    setBluetoothStatus("scanning");

    const scanResult = await requestBluetoothPrinter();
    if (!scanResult.success) {
      setBluetoothStatus("disconnected");
      setBleError(scanResult.error || "Failed to find Bluetooth printer.");
      return;
    }

    setBluetoothStatus("connecting");
    const connectResult = await connectBluetoothDevice(scanResult.device);
    if (!connectResult.success) {
      setBluetoothStatus("error");
      setBleError(connectResult.error || "Connection failed.");
      return;
    }

    const deviceName = scanResult.printerName || "Bluetooth POS Printer";
    setConnectedBleDeviceName(deviceName);
    setBluetoothStatus("connected");

    // Save as printer device
    const newPrinter: PrinterDevice = {
      id: `bt-${Date.now()}`,
      name: deviceName,
      type: "bluetooth",
      paperWidth,
      autoCut,
      openCashDrawer: kickCashDrawer,
      isDefault: true,
      lastConnectedAt: new Date().toISOString(),
      batteryLevel: 90,
    };
    savePrinterDevice(newPrinter);
  };

  const handleDisconnectBluetooth = () => {
    setBluetoothStatus("disconnected");
    setConnectedBleDeviceName(null);
    setPrintFeedback({
      type: "info",
      message: "Bluetooth printer disconnected.",
    });
  };

  // Mock Bluetooth connection for simulated testing
  const handleSimulateBluetoothConnect = () => {
    setBluetoothStatus("connecting");
    setTimeout(() => {
      setConnectedBleDeviceName("POS-58 Portable Thermal");
      setBluetoothStatus("connected");
      setPrintFeedback({
        type: "success",
        message: "Paired with simulated Bluetooth POS-58 printer.",
      });
    }, 600);
  };

  // ==========================================
  // HOTSPOT / WI-FI ACTIONS
  // ==========================================

  const handleTestHotspot = async () => {
    setTestingHotspot(true);
    setHotspotTestResult(null);

    const result = await testHotspotPrinterConnection(hotspotIp, hotspotPort, 2500);
    setTestingHotspot(false);
    setHotspotTestResult({
      success: result.online,
      message: result.message,
    });
  };

  const handleSetHotspotPreset = (ip: string, port = 9100) => {
    setHotspotIp(ip);
    setHotspotPort(port);
    setHotspotTestResult(null);
  };

  // ==========================================
  // PRINT EXECUTION DISPATCHER
  // ==========================================

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    setPrintFeedback(null);

    try {
      // Build ESC/POS binary data
      const binaryPayload = buildEscPosBinary(receiptText, {
        paperWidth,
        autoCut,
        openCashDrawer: kickCashDrawer,
      });

      if (activeTab === "bluetooth") {
        // Send via Bluetooth
        const res = await sendBluetoothBytes(binaryPayload);
        if (res.success) {
          setPrintFeedback({
            type: "success",
            message: `Printed ${res.bytesWritten} bytes to Bluetooth printer "${connectedBleDeviceName || "POS-58"}"!`,
          });
        } else {
          setPrintFeedback({
            type: "error",
            message: res.error || "Bluetooth transmission failed.",
          });
        }
      } else if (activeTab === "hotspot") {
        // Send via Hotspot / Wi-Fi IP
        const res = await sendHotspotPrintJob(hotspotIp, hotspotPort, binaryPayload, hotspotProtocol);
        if (res.success) {
          setPrintFeedback({
            type: "success",
            message: `Receipt dispatched to Hotspot Printer (${hotspotIp}:${hotspotPort})`,
          });
        } else {
          setPrintFeedback({
            type: "error",
            message: res.message,
          });
        }
      } else {
        // System / AirPrint / Browser Thermal Dialog
        printThermalReceiptViaBrowser(receiptText, paperWidth, currentBusiness.name);
        setPrintFeedback({
          type: "success",
          message: "Triggered system print dialog for thermal receipt.",
        });
      }

      // Save settings for next time
      savePrinterSettings({
        defaultPaperWidth: paperWidth,
        autoCutPaper: autoCut,
        kickCashDrawer,
        hotspotIpAddress: hotspotIp,
        hotspotPort,
        hotspotProtocol,
      });
    } catch (err: any) {
      setPrintFeedback({
        type: "error",
        message: err.message || "Print job failed.",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Quick cash drawer kick test
  const handleKickDrawerNow = async () => {
    const kickBytes = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    if (activeTab === "bluetooth") {
      await sendBluetoothBytes(kickBytes);
      setPrintFeedback({ type: "success", message: "Cash drawer pulse sent via Bluetooth." });
    } else {
      await sendHotspotPrintJob(hotspotIp, hotspotPort, kickBytes, hotspotProtocol);
      setPrintFeedback({ type: "success", message: "Cash drawer pulse sent to Hotspot printer." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-3xl bg-white sm:rounded-3xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Connect & Print</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  ESC/POS & Thermal
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Print invoices & receipts via Bluetooth, Hotspot Wi-Fi, or System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Connection Mode Selector */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            id="tab-printer-bluetooth"
            onClick={() => setActiveTab("bluetooth")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bluetooth"
                ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Bluetooth</span>
            {bluetoothStatus === "connected" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            id="tab-printer-hotspot"
            onClick={() => setActiveTab("hotspot")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "hotspot"
                ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Hotspot / Wi-Fi</span>
          </button>

          <button
            type="button"
            id="tab-printer-system"
            onClick={() => setActiveTab("system")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "system"
                ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>System / AirPrint</span>
          </button>
        </div>

        {/* Two-Column Body: Controls & Live Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Printer Connection & Hardware Settings (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* TAB 1: BLUETOOTH PRINTER */}
            {activeTab === "bluetooth" && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Bluetooth Thermal Printer
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      bluetoothStatus === "connected"
                        ? "bg-emerald-100 text-emerald-800"
                        : bluetoothStatus === "connecting" || bluetoothStatus === "scanning"
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {bluetoothStatus}
                  </span>
                </div>

                {bluetoothStatus === "connected" ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {connectedBleDeviceName || "POS-58 Bluetooth Printer"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Ready for ESC/POS transmission • 85% Battery
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectBluetooth}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Connect to portable ESC/POS thermal printers (e.g., MUNBYN, Xprinter, Zebra, Netum, POS-58, POS-80) via Bluetooth.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        id="scan-bluetooth-btn"
                        onClick={handleScanBluetooth}
                        disabled={bluetoothStatus === "scanning"}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
                      >
                        <Radio className={`w-3.5 h-3.5 ${bluetoothStatus === "scanning" ? "animate-spin" : ""}`} />
                        {bluetoothStatus === "scanning" ? "Scanning for Devices..." : "Scan & Pair Bluetooth"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateBluetoothConnect}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs"
                        title="Simulate connection for environments without Bluetooth hardware"
                      >
                        Quick Test Pair
                      </button>
                    </div>

                    {!bluetoothSupported && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Web Bluetooth is restricted in this browser frame. Use "Quick Test Pair" to preview thermal ESC/POS commands, or use System Print.
                        </span>
                      </div>
                    )}

                    {bleError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                        {bleError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HOTSPOT / WI-FI PRINTER */}
            {activeTab === "hotspot" && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Hotspot & Network Wi-Fi Printer
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                    LAN / AP
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Connect to thermal receipt printers tethered to your phone's mobile hotspot or local Wi-Fi router.
                </p>

                {/* Subnet Quick Presets */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hotspot Subnet Presets:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetHotspotPreset("192.168.43.100", 9100)}
                      className={`p-1.5 rounded-lg border text-left text-[10px] transition-all ${
                        hotspotIp === "192.168.43.100"
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold">Android Hotspot</div>
                      <div className="opacity-80 font-mono">192.168.43.x:9100</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetHotspotPreset("172.20.10.100", 9100)}
                      className={`p-1.5 rounded-lg border text-left text-[10px] transition-all ${
                        hotspotIp === "172.20.10.100"
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold">iOS Hotspot</div>
                      <div className="opacity-80 font-mono">172.20.10.x:9100</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetHotspotPreset("192.168.1.100", 9100)}
                      className={`p-1.5 rounded-lg border text-left text-[10px] transition-all ${
                        hotspotIp === "192.168.1.100"
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold">Router LAN</div>
                      <div className="opacity-80 font-mono">192.168.1.x:9100</div>
                    </button>
                  </div>
                </div>

                {/* IP & Port Input */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Printer IP Address
                    </label>
                    <input
                      type="text"
                      id="hotspot-printer-ip"
                      value={hotspotIp}
                      onChange={(e) => setHotspotIp(e.target.value)}
                      placeholder="192.168.43.100"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      id="hotspot-printer-port"
                      value={hotspotPort}
                      onChange={(e) => setHotspotPort(parseInt(e.target.value) || 9100)}
                      placeholder="9100"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Protocol Selector & Ping Test */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-500">Protocol:</label>
                    <select
                      value={hotspotProtocol}
                      onChange={(e: any) => setHotspotProtocol(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                    >
                      <option value="raw9100">RAW 9100 (Standard POS)</option>
                      <option value="http_epos">HTTP ePOS / XML</option>
                      <option value="system">System Gateway</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestHotspot}
                    disabled={testingHotspot}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${testingHotspot ? "animate-spin text-indigo-600" : ""}`} />
                    <span>{testingHotspot ? "Pinging..." : "Test Connection"}</span>
                  </button>
                </div>

                {hotspotTestResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 ${
                      hotspotTestResult.success
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border border-amber-200 text-amber-800"
                    }`}
                  >
                    {hotspotTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{hotspotTestResult.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SYSTEM PRINT */}
            {activeTab === "system" && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    System & AirPrint Drivers
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Directly formats the receipt using precision thermal CSS (`@media print` formatted for 58mm / 80mm rolls or A4 paper) and opens your operating system's native printer selector (AirPrint, Mopria, USB, or Network).
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                  Works seamlessly with any printer recognized by Windows, macOS, iOS, Android, or Linux.
                </div>
              </div>
            )}

            {/* HARDWARE OPTIONS: PAPER WIDTH & PERIPHERALS */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Thermal Hardware Settings
              </label>

              {/* Paper Roll Width Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Paper Roll Width:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth("58mm")}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      paperWidth === "58mm"
                        ? "border-indigo-600 bg-indigo-50/90 text-indigo-900 font-bold shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs">58 mm (2-Inch)</div>
                    <div className="text-[10px] text-slate-400">32 chars/line • Mobile POS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperWidth("80mm")}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      paperWidth === "80mm"
                        ? "border-indigo-600 bg-indigo-50/90 text-indigo-900 font-bold shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs">80 mm (3-Inch)</div>
                    <div className="text-[10px] text-slate-400">48 chars/line • Desktop / Kitchen</div>
                  </button>
                </div>
              </div>

              {/* Hardware Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCut}
                    onChange={(e) => setAutoCut(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-slate-500" />
                    Auto-Cut Paper
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kickCashDrawer}
                    onChange={(e) => setKickCashDrawer(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Kick Cash Drawer
                  </div>
                </label>
              </div>

              {/* Drawer test action */}
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                <span>Want to test drawer pulse?</span>
                <button
                  type="button"
                  onClick={handleKickDrawerNow}
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Pulse Drawer Now
                </button>
              </div>
            </div>

            {/* Print Status Feedback */}
            {printFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  printFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : printFeedback.type === "error"
                    ? "bg-rose-50 border border-rose-200 text-rose-900"
                    : "bg-indigo-50 border border-indigo-200 text-indigo-900"
                }`}
              >
                {printFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{printFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Thermal Receipt Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Receipt Preview ({paperWidth})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("document")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    previewMode === "document"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("test")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    previewMode === "test"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Test Page
                </button>
              </div>
            </div>

            {/* Realistic Thermal Receipt Visual Paper */}
            <div className="flex-1 bg-slate-200/80 p-3 rounded-2xl flex items-center justify-center overflow-hidden">
              <div
                className={`bg-white text-slate-900 shadow-md p-4 rounded-lg font-mono text-[10px] leading-tight select-all overflow-y-auto max-h-[380px] w-full ${
                  paperWidth === "58mm" ? "max-w-[260px]" : "max-w-[320px]"
                }`}
                style={{
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)",
                  borderBottom: "6px dashed #cbd5e1",
                }}
              >
                <pre className="whitespace-pre-wrap font-mono text-[9px] sm:text-[10px] text-slate-800 leading-snug">
                  {receiptText}
                </pre>
              </div>
            </div>
            <div className="text-[10px] text-center text-slate-400">
              Formatted for ESC/POS {paperWidth === "58mm" ? "32-column" : "48-column"} thermal receipt rolls
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shadow-lg">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Target:</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">
              {activeTab === "bluetooth"
                ? `Bluetooth (${connectedBleDeviceName || "POS-58"})`
                : activeTab === "hotspot"
                ? `Hotspot (${hotspotIp}:${hotspotPort})`
                : "System AirPrint / Thermal Roll"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              id="execute-print-btn"
              onClick={handleExecutePrint}
              disabled={isPrinting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Sending Print Job..." : "Print Receipt Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
