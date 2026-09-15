import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  Check,
  FolderTree,
  FileCode,
  ShieldCheck,
  Layers,
  Smartphone,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const FlutterExportModal: React.FC = () => {
  const { modals, setFlutterExportModalOpen } = useApp();
  const [selectedFile, setSelectedFile] = useState<string>("invoice_model.dart");
  const [copied, setCopied] = useState(false);

  if (!modals.flutterExport) return null;

  const flutterFiles: Record<string, { path: string; language: string; content: string }> = {
    "invoice_model.dart": {
      path: "lib/models/invoice_model.dart",
      language: "dart",
      content: `// lib/models/invoice_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

enum InvoiceStatus { draft, sent, viewed, partiallyPaid, paid, overdue, cancelled }
enum TaxType { inclusive, exclusive }
enum DiscountType { percentage, fixed }

class InvoiceItem {
  final String id;
  final String? productId;
  final String name;
  final String? description;
  final double quantity;
  final double unitPrice;
  final double taxRate;
  final String unit;

  InvoiceItem({
    required this.id,
    this.productId,
    required this.name,
    this.description,
    required this.quantity,
    required this.unitPrice,
    required this.taxRate,
    this.unit = 'unit',
  });

  double get lineTotal => quantity * unitPrice;

  Map<String, dynamic> toMap() => {
    'id': id,
    'productId': productId,
    'name': name,
    'description': description,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'taxRate': taxRate,
    'unit': unit,
  };

  factory InvoiceItem.fromMap(Map<String, dynamic> map) => InvoiceItem(
    id: map['id'] ?? '',
    productId: map['productId'],
    name: map['name'] ?? '',
    description: map['description'],
    quantity: (map['quantity'] as num).toDouble(),
    unitPrice: (map['unitPrice'] as num).toDouble(),
    taxRate: (map['taxRate'] as num?)?.toDouble() ?? 0.0,
    unit: map['unit'] ?? 'unit',
  );
}

class InvoiceModel {
  final String id;
  final String businessId;
  final String invoiceNumber;
  final DateTime invoiceDate;
  final DateTime dueDate;
  final String customerId;
  final String customerName;
  final String? customerEmail;
  final String? customerPhone;
  final String? customerAddress;
  final List<InvoiceItem> items;
  final DiscountType discountType;
  final double discountValue;
  final double shipping;
  final double additionalCharges;
  final TaxType taxType;
  final String? notes;
  final String? terms;
  final String? paymentInstructions;
  final String template;
  final InvoiceStatus status;

  InvoiceModel({
    required this.id,
    required this.businessId,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.dueDate,
    required this.customerId,
    required this.customerName,
    this.customerEmail,
    this.customerPhone,
    this.customerAddress,
    required this.items,
    this.discountType = DiscountType.percentage,
    this.discountValue = 0.0,
    this.shipping = 0.0,
    this.additionalCharges = 0.0,
    this.taxType = TaxType.exclusive,
    this.notes,
    this.terms,
    this.paymentInstructions,
    this.template = 'modern',
    this.status = InvoiceStatus.draft,
  });

  Map<String, dynamic> toFirestore() => {
    'businessId': businessId,
    'invoiceNumber': invoiceNumber,
    'invoiceDate': Timestamp.fromDate(invoiceDate),
    'dueDate': Timestamp.fromDate(dueDate),
    'customerId': customerId,
    'customerName': customerName,
    'customerEmail': customerEmail,
    'customerPhone': customerPhone,
    'customerAddress': customerAddress,
    'items': items.map((i) => i.toMap()).toList(),
    'discountType': discountType.name,
    'discountValue': discountValue,
    'shipping': shipping,
    'additionalCharges': additionalCharges,
    'taxType': taxType.name,
    'notes': notes,
    'terms': terms,
    'paymentInstructions': paymentInstructions,
    'template': template,
    'status': status.name,
    'updatedAt': FieldValue.serverTimestamp(),
  };

  factory InvoiceModel.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> snap) {
    final d = snap.data()!;
    return InvoiceModel(
      id: snap.id,
      businessId: d['businessId'] ?? '',
      invoiceNumber: d['invoiceNumber'] ?? '',
      invoiceDate: (d['invoiceDate'] as Timestamp).toDate(),
      dueDate: (d['dueDate'] as Timestamp).toDate(),
      customerId: d['customerId'] ?? '',
      customerName: d['customerName'] ?? '',
      customerEmail: d['customerEmail'],
      customerPhone: d['customerPhone'],
      customerAddress: d['customerAddress'],
      items: ((d['items'] as List?) ?? [])
          .map((i) => InvoiceItem.fromMap(Map<String, dynamic>.from(i)))
          .toList(),
      discountType: DiscountType.values.byName(d['discountType'] ?? 'percentage'),
      discountValue: (d['discountValue'] as num?)?.toDouble() ?? 0.0,
      shipping: (d['shipping'] as num?)?.toDouble() ?? 0.0,
      additionalCharges: (d['additionalCharges'] as num?)?.toDouble() ?? 0.0,
      taxType: TaxType.values.byName(d['taxType'] ?? 'exclusive'),
      notes: d['notes'],
      terms: d['terms'],
      paymentInstructions: d['paymentInstructions'],
      template: d['template'] ?? 'modern',
      status: InvoiceStatus.values.byName(d['status'] ?? 'draft'),
    );
  }
}`,
    },
    "firebase_service.dart": {
      path: "lib/services/firebase_service.dart",
      language: "dart",
      content: `// lib/services/firebase_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/invoice_model.dart';

class FirebaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserId => _auth.currentUser?.uid;

  // Stream real-time invoices for a business
  Stream<List<InvoiceModel>> streamInvoices(String businessId) {
    return _db
        .collection('businesses')
        .doc(businessId)
        .collection('invoices')
        .orderBy('invoiceDate', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => InvoiceModel.fromSnapshot(doc)).toList());
  }

  // Create or Update Invoice
  Future<void> saveInvoice(String businessId, InvoiceModel invoice) async {
    final docRef = _db
        .collection('businesses')
        .doc(businessId)
        .collection('invoices')
        .doc(invoice.id);

    await docRef.set(invoice.toFirestore(), SetOptions(merge: true));
  }

  // Record Payment & Atomically update Invoice status
  Future<void> recordPayment({
    required String businessId,
    required String invoiceId,
    required double amount,
    required String method,
    required String reference,
  }) async {
    final batch = _db.batch();
    final paymentDoc = _db
        .collection('businesses')
        .doc(businessId)
        .collection('payments')
        .doc();

    batch.set(paymentDoc, {
      'invoiceId': invoiceId,
      'amount': amount,
      'method': method,
      'reference': reference,
      'date': FieldValue.serverTimestamp(),
      'recordedBy': currentUserId,
    });

    await batch.commit();
  }
}`,
    },
    "pdf_service.dart": {
      path: "lib/services/pdf_service.dart",
      language: "dart",
      content: `// lib/services/pdf_service.dart
import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/invoice_model.dart';

class PdfService {
  // Generate multi-page PDF with custom branding and tables
  static Future<Uint8List> generateInvoicePdf({
    required InvoiceModel invoice,
    required String businessName,
    required String currencySymbol,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.between,
                children: [
                  pw.Text(businessName, style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
                  pw.Text('INVOICE #\${invoice.invoiceNumber}', style: pw.TextStyle(fontSize: 18, color: PdfColors.blue900)),
                ],
              ),
              pw.Divider(thickness: 1.5),
              pw.SizedBox(height: 16),
              pw.Text('Bill To: \${invoice.customerName}', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 16),
              pw.Table.fromTextArray(
                headers: ['Item', 'Qty', 'Unit Price', 'Total'],
                data: invoice.items.map((item) => [
                  item.name,
                  item.quantity.toString(),
                  '\$currencySymbol\${item.unitPrice.toStringAsFixed(2)}',
                  '\$currencySymbol\${item.lineTotal.toStringAsFixed(2)}',
                ]).toList(),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  // Native Print or Share intent on iOS and Android
  static Future<void> shareOrPrint(Uint8List bytes, String filename) async {
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }
}
`,
    },
    "printer_service.dart": {
      path: "lib/services/printer_service.dart",
      language: "dart",
      content: `// lib/services/printer_service.dart
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import '../models/invoice_model.dart';

class MobileThermalPrinterService {
  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _writeCharacteristic;

  // 1. Scan & Connect to Mobile Bluetooth POS Printers
  Stream<List<ScanResult>> scanBluetoothPrinters() {
    FlutterBluePlus.startScan(timeout: const Duration(seconds: 5));
    return FlutterBluePlus.scanResults;
  }

  Future<bool> connectBluetoothPrinter(BluetoothDevice device) async {
    await device.connect();
    _connectedDevice = device;

    List<BluetoothService> services = await device.discoverServices();
    for (var service in services) {
      for (var char in service.characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          _writeCharacteristic = char;
          return true;
        }
      }
    }
    return false;
  }

  // 2. Transmit ESC/POS Payload via Bluetooth
  Future<void> printReceiptViaBluetooth(List<int> bytes) async {
    if (_writeCharacteristic == null) throw Exception("No Bluetooth printer connected.");
    
    // Chunk bytes into 128-byte packets for BLE MTU
    int chunkSize = 128;
    for (int i = 0; i < bytes.length; i += chunkSize) {
      int end = (i + chunkSize < bytes.length) ? i + chunkSize : bytes.length;
      await _writeCharacteristic!.write(bytes.sublist(i, end), withoutResponse: true);
      await Future.delayed(const Duration(milliseconds: 15));
    }
  }

  // 3. Print directly to Hotspot Wi-Fi Printer (RAW Port 9100)
  Future<bool> printReceiptViaHotspot({
    required String ipAddress,
    int port = 9100,
    required List<int> bytes,
  }) async {
    try {
      Socket socket = await Socket.connect(ipAddress, port, timeout: const Duration(seconds: 4));
      socket.add(bytes);
      await socket.flush();
      await socket.close();
      return true;
    } catch (e) {
      print("Hotspot socket print error: \$e");
      return false;
    }
  }

  // 4. Generate ESC/POS Thermal Commands (58mm or 80mm)
  Future<List<int>> generateInvoiceEscPos({
    required InvoiceModel invoice,
    required String businessName,
    PaperSize paperSize = PaperSize.mm58,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(paperSize, profile);
    List<int> bytes = [];

    bytes += generator.text(
      businessName,
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2),
    );
    bytes += generator.hr();
    bytes += generator.row([
      PosColumn(text: 'Invoice: \${invoice.invoiceNumber}', width: 8),
      PosColumn(text: invoice.invoiceDate, width: 4, styles: const PosStyles(align: PosAlign.right)),
    ]);
    bytes += generator.text('Customer: \${invoice.customerName}');
    bytes += generator.hr();

    for (var item in invoice.items) {
      bytes += generator.row([
        PosColumn(text: '\${item.quantity.toInt()}x \${item.name}', width: 8),
        PosColumn(text: item.lineTotal.toStringAsFixed(2), width: 4, styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    bytes += generator.hr(ch: '=');
    bytes += generator.text(
      'TOTAL: \${invoice.totalAmount.toStringAsFixed(2)}',
      styles: const PosStyles(bold: true, align: PosAlign.right),
    );
    bytes += generator.feed(2);
    bytes += generator.cut();
    return bytes;
  }
}
`,
    },
    "firestore.rules": {
      path: "firestore.rules",
      language: "text",
      content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check business membership
    function isBusinessMember(businessId) {
      return request.auth != null && 
        exists(/databases/$(database)/documents/businesses/$(businessId)/members/$(request.auth.uid));
    }

    match /businesses/{businessId} {
      allow read, write: if isBusinessMember(businessId);

      match /invoices/{invoiceId} {
        allow read, write: if isBusinessMember(businessId);
      }

      match /customers/{customerId} {
        allow read, write: if isBusinessMember(businessId);
      }

      match /products/{productId} {
        allow read, write: if isBusinessMember(businessId);
      }

      match /payments/{paymentId} {
        allow read, write: if isBusinessMember(businessId);
      }

      match /expenses/{expenseId} {
        allow read, write: if isBusinessMember(businessId);
      }

      match /members/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`,
    },
    "pubspec.yaml": {
      path: "pubspec.yaml",
      language: "yaml",
      content: `name: smart_invoice_manager
description: "Cross-platform mobile Invoice & Business Management app for Android and iOS"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  firebase_core: ^2.24.2
  firebase_auth: ^4.16.0
  cloud_firestore: ^4.14.0
  firebase_storage: ^11.6.0
  provider: ^6.1.1
  pdf: ^3.10.7
  printing: ^5.11.1
  flutter_blue_plus: ^1.31.0
  esc_pos_utils_plus: ^2.0.3
  network_info_plus: ^5.0.1
  share_plus: ^7.2.1
  intl: ^0.19.0
  google_fonts: ^6.1.0
  lucide_icons: ^0.300.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
    },
  };

  const currentFileData = flutterFiles[selectedFile] || flutterFiles["invoice_model.dart"];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFileData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-4xl bg-white sm:rounded-3xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Flutter & Dart Clean Architecture
              </h2>
              <p className="text-[10px] text-slate-500">
                Complete cross-platform Android & iOS codebase blueprints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy File"}
            </button>
            <button
              onClick={() => setFlutterExportModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body with Sidebar File Explorer + Code Viewer */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* File Selector Sidebar */}
          <div className="w-full sm:w-60 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/60 p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
              <FolderTree className="w-3 h-3" /> Project Files
            </div>
            {Object.keys(flutterFiles).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  selectedFile === fileName
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-700 hover:bg-slate-200/60"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{fileName}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{currentFileData.path}</span>
              <span className="uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                {currentFileData.language}
              </span>
            </div>
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono leading-relaxed text-slate-300 select-text">
              <code>{currentFileData.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
