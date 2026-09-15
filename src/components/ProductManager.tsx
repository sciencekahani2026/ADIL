import React, { useState } from "react";
import {
  Package,
  Search,
  Plus,
  Tag,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  TrendingUp,
  Layers,
  Wrench,
  SlidersHorizontal,
  BellRing,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ProductService, ItemType } from "../types";
import { formatCurrency } from "../utils/calculations";

export const ProductManager: React.FC = () => {
  const {
    currentBusiness,
    products,
    saveProduct,
    deleteProduct,
    adjustStock,
    modals,
    openProductModal,
    closeProductModal,
    t,
  } = useApp();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service" | "low_stock">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // User-defined threshold settings
  const [userThreshold, setUserThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("smart_invoice_low_stock_threshold");
      return saved ? Math.max(1, parseInt(saved, 10)) : 5;
    } catch {
      return 5;
    }
  });

  const [useGlobalThreshold, setUseGlobalThreshold] = useState<boolean>(() => {
    try {
      return localStorage.getItem("smart_invoice_use_global_threshold") === "true";
    } catch {
      return false;
    }
  });

  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);

  const currency = currentBusiness.currency || "USD";

  // Effective threshold helper for a given product
  const getEffectiveThreshold = (product: ProductService): number => {
    if (useGlobalThreshold) return userThreshold;
    return product.lowStockThreshold !== undefined && product.lowStockThreshold !== null
      ? product.lowStockThreshold
      : userThreshold;
  };

  const handleSetUserThreshold = (val: number) => {
    const cleanVal = Math.max(1, Math.floor(val));
    setUserThreshold(cleanVal);
    try {
      localStorage.setItem("smart_invoice_low_stock_threshold", cleanVal.toString());
    } catch {}
  };

  const handleToggleGlobalThreshold = (enabled: boolean) => {
    setUseGlobalThreshold(enabled);
    try {
      localStorage.setItem("smart_invoice_use_global_threshold", enabled ? "true" : "false");
    } catch {}
  };

  const handleApplyThresholdToAll = () => {
    products.forEach((p) => {
      if (p.type === "product") {
        saveProduct({
          ...p,
          lowStockThreshold: userThreshold,
        });
      }
    });
    setShowThresholdSettings(false);
  };

  // Physical products and services breakdown
  const physicalProducts = products.filter((p) => p.type === "product");
  const lowStockProducts = physicalProducts.filter(
    (p) => p.stockQuantity <= getEffectiveThreshold(p)
  );
  const outOfStockProducts = lowStockProducts.filter((p) => p.stockQuantity === 0);
  const criticalStockProducts = lowStockProducts.filter((p) => p.stockQuantity > 0);

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (typeFilter === "low_stock") {
      if (p.type !== "product") return false;
      if (p.stockQuantity > getEffectiveThreshold(p)) return false;
    } else if (typeFilter !== "all" && p.type !== typeFilter) {
      return false;
    }

    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-3 pb-20 pt-1 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{t.products} & Services</h1>
          <p className="text-xs text-slate-500">
            {filteredProducts.length} items in catalog
            {lowStockProducts.length > 0 && (
              <span className="ml-2 font-bold text-amber-600">
                • {lowStockProducts.length} low stock
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="open-threshold-settings-header-btn"
            type="button"
            onClick={() => setShowThresholdSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors"
            title="Configure Low Stock Notification Threshold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Alert Threshold:</span>
            <span className="text-indigo-600 font-extrabold">{userThreshold}</span>
          </button>
          <button
            onClick={() => openProductModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {t.addProduct}
          </button>
        </div>
      </div>

      {/* Low Stock Notification Alert Banner */}
      {lowStockProducts.length > 0 && (
        <>
          {showLowStockBanner ? (
            <div
              id="low-stock-notification-banner"
              className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 rounded-2xl p-3.5 shadow-2xs relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300 mt-0.5">
                    <BellRing className="w-4.5 h-4.5 text-amber-700 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        Low Stock Notification: {lowStockProducts.length} {lowStockProducts.length === 1 ? "Product Requires" : "Products Require"} Restocking
                      </span>
                      {outOfStockProducts.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                          {outOfStockProducts.length} Out of Stock
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Threshold: {useGlobalThreshold ? `Global (${userThreshold})` : `Per-item (Default: ${userThreshold})`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {outOfStockProducts.length > 0
                        ? `${outOfStockProducts.length} item(s) are completely exhausted and ${criticalStockProducts.length} item(s) are at or below safety stock.`
                        : `Stock levels are below your defined notification threshold (${userThreshold} units). Take action to avoid order fulfillment delays.`}
                    </p>

                    {/* Quick chips to highlight and filter low stock products */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {lowStockProducts.slice(0, 6).map((lp) => {
                        const effThresh = getEffectiveThreshold(lp);
                        return (
                          <button
                            key={lp.id}
                            type="button"
                            onClick={() => {
                              setSearch(lp.name);
                              setTypeFilter("all");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-transform active:scale-95 ${
                              lp.stockQuantity === 0
                                ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                                : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                            }`}
                            title={`Click to view ${lp.name} (Stock: ${lp.stockQuantity} / Threshold: ${effThresh})`}
                          >
                            <span className="truncate max-w-[130px]">{lp.name}</span>
                            <span className="font-mono bg-white/80 px-1 py-0.5 rounded text-[9px] font-black">
                              {lp.stockQuantity} / {effThresh}
                            </span>
                          </button>
                        );
                      })}
                      {lowStockProducts.length > 6 && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          +{lowStockProducts.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTypeFilter(typeFilter === "low_stock" ? "all" : "low_stock")}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      typeFilter === "low_stock"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {typeFilter === "low_stock" ? "Show All Items" : "Filter Low Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowThresholdSettings(true)}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    title="Configure Alert Threshold"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLowStockBanner(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
                    title="Dismiss alert banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {lowStockProducts.length} items currently below stock threshold ({userThreshold})
              </span>
              <button
                type="button"
                onClick={() => setShowLowStockBanner(true)}
                className="text-amber-900 font-bold underline hover:text-amber-950"
              >
                Expand Notification
              </button>
            </div>
          )}
        </>
      )}

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by name, SKU, or category..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type selector tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setTypeFilter("product")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                typeFilter === "product"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Products ({physicalProducts.length})
            </button>
            <button
              onClick={() => setTypeFilter("service")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                typeFilter === "service"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Services ({products.length - physicalProducts.length})
            </button>
            <button
              id="filter-low-stock-tab-btn"
              type="button"
              onClick={() => setTypeFilter("low_stock")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                typeFilter === "low_stock"
                  ? "bg-amber-600 text-white shadow-xs"
                  : lowStockProducts.length > 0
                  ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  lowStockProducts.length > 0 ? "text-amber-600 fill-amber-500/20" : ""
                }`}
              />
              Low Stock
              {lowStockProducts.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    typeFilter === "low_stock" ? "bg-white text-amber-700" : "bg-amber-600 text-white"
                  }`}
                >
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
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
        </div>
      </div>

      {/* Products Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">
            {typeFilter === "low_stock" ? "No low-stock items detected" : "No items found"}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {typeFilter === "low_stock"
              ? `All physical products are safely stocked above your threshold (${userThreshold} units).`
              : "Build your catalog of products and services for instant 1-click invoice line addition."}
          </p>
          {typeFilter === "low_stock" ? (
            <button
              onClick={() => setTypeFilter("all")}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              View All Items
            </button>
          ) : (
            <button
              onClick={() => openProductModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              {t.addProduct}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((prod) => {
            const effThresh = getEffectiveThreshold(prod);
            const isPhysical = prod.type === "product";
            const isLowStock = isPhysical && prod.stockQuantity <= effThresh;
            const isOutOfStock = isPhysical && prod.stockQuantity === 0;

            // Health bar progress (normalized against 2x threshold)
            const maxRef = Math.max(effThresh * 2, 10);
            const healthPct = isPhysical ? Math.min(100, Math.round((prod.stockQuantity / maxRef) * 100)) : 100;

            const margin =
              prod.cost && prod.price > 0
                ? Math.round(((prod.price - prod.cost) / prod.price) * 100)
                : null;

            return (
              <div
                key={prod.id}
                id={`product-card-${prod.id}`}
                className={`bg-white rounded-2xl border transition-all p-3.5 relative overflow-hidden ${
                  isOutOfStock
                    ? "border-rose-400 bg-rose-50/20 shadow-xs ring-1 ring-rose-400/30"
                    : isLowStock
                    ? "border-amber-400 bg-amber-50/25 shadow-xs ring-1 ring-amber-400/30"
                    : "border-slate-200/90 shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* Visual accent top strip for low stock */}
                {isOutOfStock ? (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                ) : isLowStock ? (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                ) : null}

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOutOfStock
                          ? "bg-rose-100 text-rose-700 border border-rose-300"
                          : isLowStock
                          ? "bg-amber-100 text-amber-700 border border-amber-300"
                          : prod.type === "product"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {prod.type === "product" ? (
                        <Package className="w-5 h-5" />
                      ) : (
                        <Wrench className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{prod.name}</span>
                        {prod.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {prod.category}
                          </span>
                        )}
                        {/* Status notification badge */}
                        {isOutOfStock ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Out of Stock (0 / {effThresh})
                          </span>
                        ) : isLowStock ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock: only {prod.stockQuantity} left (Threshold: {effThresh})
                          </span>
                        ) : null}
                      </div>
                      {prod.sku && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {prod.sku}
                        </div>
                      )}
                      {prod.description && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {prod.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing info */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900">
                      {formatCurrency(prod.price, currency)}
                      <span className="text-[10px] text-slate-400 font-normal">
                        /{prod.unit || "unit"}
                      </span>
                    </div>
                    {margin !== null && (
                      <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                        {margin}% margin
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Level Bar (for physical products) */}
                {isPhysical && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600">Inventory Status:</span>
                        <span
                          className={`font-black ${
                            isOutOfStock
                              ? "text-rose-600"
                              : isLowStock
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {prod.stockQuantity} {prod.unit || "units"} available
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          (Alert threshold: {effThresh})
                        </span>
                      </div>
                      {isLowStock && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                          Restock recommended
                        </span>
                      )}
                    </div>

                    {/* Visual Meter */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOutOfStock
                            ? "w-0 bg-rose-500"
                            : isLowStock
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${healthPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stock tracker controls & action buttons */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  {prod.type === "product" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">Quick Adjust:</span>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => adjustStock(prod.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 font-black text-xs flex items-center justify-center shadow-2xs active:scale-95 transition-all"
                          title="Decrease 1 unit"
                        >
                          -
                        </button>
                        <span
                          className={`text-xs font-black px-2 min-w-[28px] text-center ${
                            isOutOfStock
                              ? "text-rose-600"
                              : isLowStock
                              ? "text-amber-600"
                              : "text-slate-800"
                          }`}
                        >
                          {prod.stockQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustStock(prod.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-slate-200 font-black text-xs flex items-center justify-center shadow-2xs active:scale-95 transition-all"
                          title="Increase 1 unit"
                        >
                          +
                        </button>
                      </div>

                      {/* Fast Replenish Shortcuts */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustStock(prod.id, 5)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-colors active:scale-95"
                          title="Instantly add 5 units to stock"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStock(prod.id, 10)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-colors active:scale-95"
                          title="Instantly add 10 units to stock"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium italic">
                      Service / Non-inventoried item
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openProductModal(prod)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${prod.name}?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Threshold Settings Modal */}
      {showThresholdSettings && (
        <ThresholdSettingsModal
          userThreshold={userThreshold}
          onSaveThreshold={handleSetUserThreshold}
          useGlobalThreshold={useGlobalThreshold}
          onToggleGlobalThreshold={handleToggleGlobalThreshold}
          onApplyToAll={handleApplyThresholdToAll}
          onClose={() => setShowThresholdSettings(false)}
          totalProducts={physicalProducts.length}
          matchingCount={lowStockProducts.length}
        />
      )}

      {/* Add / Edit Product Modal */}
      {modals.product.open && (
        <ProductFormModal defaultUserThreshold={userThreshold} />
      )}
    </div>
  );
};

// Low-Stock Threshold Configuration Modal
interface ThresholdSettingsModalProps {
  userThreshold: number;
  onSaveThreshold: (val: number) => void;
  useGlobalThreshold: boolean;
  onToggleGlobalThreshold: (enabled: boolean) => void;
  onApplyToAll: () => void;
  onClose: () => void;
  totalProducts: number;
  matchingCount: number;
}

const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  userThreshold,
  onSaveThreshold,
  useGlobalThreshold,
  onToggleGlobalThreshold,
  onApplyToAll,
  onClose,
  totalProducts,
  matchingCount,
}) => {
  const [val, setVal] = useState<number>(userThreshold);
  const presets = [2, 3, 5, 10, 15, 25];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThreshold(val);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Low-Stock Alert Threshold</h3>
              <p className="text-[11px] text-slate-500">Configure safety thresholds for inventory notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Threshold Number Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              User-Defined Low-Stock Threshold (Units)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="threshold-number-input"
                type="number"
                min="1"
                max="9999"
                value={val}
                onChange={(e) => setVal(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-xs font-bold text-slate-500">units</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-400 mr-1">Presets:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVal(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    val === preset
                      ? "bg-amber-500 border-amber-600 text-white shadow-2xs scale-105"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switch: Global vs Individual */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Use Global Threshold for All Products</div>
                <div className="text-[11px] text-slate-500">
                  {useGlobalThreshold
                    ? `Currently alerting on all products with ≤ ${val} units.`
                    : "Products use their own individual thresholds (fallback to this threshold)."}
                </div>
              </div>
              <input
                id="toggle-global-threshold-checkbox"
                type="checkbox"
                checked={useGlobalThreshold}
                onChange={(e) => onToggleGlobalThreshold(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Bulk Apply Action */}
          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between gap-2">
            <div className="text-[11px] text-indigo-900">
              <span className="font-bold">Sync all items:</span> Set every physical product ({totalProducts} items) to have a threshold of <strong>{val}</strong> units.
            </div>
            <button
              type="button"
              onClick={() => {
                onSaveThreshold(val);
                onApplyToAll();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
            >
              Apply to All
            </button>
          </div>

          {/* Real-time preview */}
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Products with stock falling to or below this number will display warning borders, alert badges, and appear in the notification banner.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Save Threshold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductFormModal: React.FC<{ defaultUserThreshold?: number }> = ({ defaultUserThreshold = 5 }) => {
  const { currentBusiness, modals, closeProductModal, saveProduct, t } = useApp();
  const product = modals.product.product;
  const isNew = !product;

  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "General");
  const [type, setType] = useState<ItemType>(product?.type || "product");
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [cost, setCost] = useState<number>(product?.cost || 0);
  const [taxRate, setTaxRate] = useState<number>(
    product?.taxRate !== undefined ? product.taxRate : currentBusiness.defaultTaxRate
  );
  const [unit, setUnit] = useState(product?.unit || "unit");
  const [stockQuantity, setStockQuantity] = useState<number>(product?.stockQuantity || 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    product?.lowStockThreshold !== undefined ? product.lowStockThreshold : defaultUserThreshold
  );

  const currency = currentBusiness.currency || "USD";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Item name is required.");
      return;
    }
    saveProduct({
      id: product?.id,
      name: name.trim(),
      sku: sku.trim(),
      description: description.trim(),
      category: category.trim(),
      type,
      price: Math.max(0, Number(price) || 0),
      cost: Math.max(0, Number(cost) || 0),
      taxRate: Math.max(0, Number(taxRate) || 0),
      unit: unit.trim(),
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 0),
    });
    closeProductModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            {isNew ? t.addProduct : "Edit Item"}
          </h3>
          <button
            onClick={closeProductModal}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {/* Type radio buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("product")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                type === "product"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              Physical Product
            </button>
            <button
              type="button"
              onClick={() => setType("service")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                type === "service"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              Service / Hourly
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Design or SSD Drive"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Consulting"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">SKU / Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Price ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cost ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs / hrs / box"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {type === "product" && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Low Stock Alert Threshold</span>
                    <span className="text-amber-600 font-bold text-[10px]">≤ {lowStockThreshold}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Threshold Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Threshold presets:</span>
                {[2, 3, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLowStockThreshold(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      lowStockThreshold === preset
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                When stock falls to or below this threshold, automatic warning badges and notifications will highlight this item.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product specs, scope..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeProductModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
