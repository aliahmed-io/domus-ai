"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  FileDown,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ShoppingCart,
  Building,
  Check,
  X,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { jsPDF } from "jspdf";
import * as Accordion from "@radix-ui/react-accordion";
import { toast } from "sonner";
import { generateFloorPlanDXF } from "@/lib/export/floor-plan-dxf";
import { generateFloorPlanIFC } from "@/lib/export/floor-plan-ifc";

interface MatchedItem {
  category: string;
  name: string;
  vendor: "Home Depot" | "IKEA" | "Søren Furniture" | "Sherwin-Williams";
  sku: string;
  unitPrice: number;
  quantity: number;
  unit: string;
}

export default function ResultsPanel() {
  const {
    floorPlanLayout,
    setFloorPlan,
    bomReport,
    violations,
    isGenerating,
  } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      bomReport: s.bomReport,
      violations: s.violations,
      isGenerating: s.isGenerating,
    }))
  );

  const [activeLayoutIdx, setActiveLayoutIdx] = useState<number>(1);
  const [isProcuring, setIsProcuring] = useState(false);
  const [procureStep, setProcureStep] = useState<"cart" | "submitting" | "success">("cart");

  // Layout variant click
  const handleSelectLayout = (index: number) => {
    setActiveLayoutIdx(index);
    if (floorPlanLayout) {
      setFloorPlan({
        ...floorPlanLayout,
        id: `layout-${index}-${floorPlanLayout.parameters.style}-${floorPlanLayout.parameters.totalArea}`,
        efficiency: 75 + index * 5,
        naturalLight: 70 + (4 - index) * 6,
      });
    }
  };

  // Mock CSV exporter
  const handleExportCSV = () => {
    if (!bomReport) return;
    const headers = "Category,Item Name,Vendor,SKU,Unit Price,Quantity,Unit,Total Cost\n";
    const rows = getMatchedItems()
      .map(
        (item) =>
          `${item.vendor},${item.name},${item.sku},${item.unitPrice},${item.quantity},${item.unit},${(
            item.unitPrice * item.quantity
          ).toFixed(2)}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Domus_BOM_Procurement_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Real PDF Exporter using jsPDF (Bug B1 fix)
  const handleExportPDF = async () => {
    if (!floorPlanLayout) return;

    try {
      toast.loading("Generating PDF Report...", { id: "pdf-export" });
      const doc = new jsPDF();

      // Set Font & Theme
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(44, 38, 33); // charcoal
      doc.text("DOMUS AI — BIM PROCUREMENT REPORT", 20, 30);

      // Horizontal Divider
      doc.setDrawColor(234, 229, 223); // hairline border
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      // Metadata Section
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(138, 126, 116); // stone text
      doc.text(`Generated At: ${new Date().toLocaleString()}`, 20, 42);
      doc.text(`Layout ID: ${floorPlanLayout.id}`, 20, 48);

      // Core parameters
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(44, 38, 33);
      doc.text("1. Project Specifications", 20, 60);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Bedrooms: ${floorPlanLayout.parameters.bedrooms}`, 25, 70);
      doc.text(`Bathrooms: ${floorPlanLayout.parameters.bathrooms}`, 25, 77);
      doc.text(`Total Footprint: ${floorPlanLayout.parameters.totalArea} sq ft`, 25, 84);
      doc.text(`Layout Style: ${floorPlanLayout.parameters.style.toUpperCase()}`, 25, 91);
      doc.text(`BIM Space Efficiency: ${floorPlanLayout.efficiency}%`, 25, 98);
      doc.text(`Natural Light Score: ${floorPlanLayout.naturalLight}%`, 25, 105);

      // BOM Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("2. Bill of Materials (BOM) & Estimated Costs", 20, 120);

      let yPos = 130;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Category", 20, yPos);
      doc.text("Item Name", 50, yPos);
      doc.text("Vendor", 95, yPos);
      doc.text("Qty", 130, yPos);
      doc.text("Unit Cost", 150, yPos);
      doc.text("Total Cost", 170, yPos);

      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 8;

      doc.setFont("helvetica", "normal");
      const matched = getMatchedItems();
      matched.forEach((item) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }
        doc.text(item.category, 20, yPos);
        doc.text(item.name.substring(0, 22), 50, yPos);
        doc.text(item.vendor, 95, yPos);
        doc.text(`${item.quantity} ${item.unit}`, 130, yPos);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 150, yPos);
        const itemTotal = item.unitPrice * item.quantity;
        doc.text(`$${itemTotal.toFixed(2)}`, 170, yPos);
        yPos += 7;
      });

      doc.line(20, yPos - 3, 190, yPos - 3);
      yPos += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Grand Total Estimate:", 120, yPos);
      doc.text(`$${grandTotal.toFixed(2)}`, 170, yPos);

      // Compliance
      yPos += 15;
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("3. IBC Code Compliance Checks", 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      if (violations && violations.length > 0) {
        violations.forEach((v) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 30;
          }
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 50, 50); // red-error
          doc.text(`[${v.code}] ${v.severity.toUpperCase()}`, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(44, 38, 33);
          doc.text(v.message, 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "oblique");
          doc.text(`Recommendation: ${v.recommendation}`, 25, yPos);
          yPos += 8;
        });
      } else {
        doc.setTextColor(40, 150, 40); // green-success
        doc.text("ALL INTERNATIONAL BUILDING CODE (IBC) CHECKS PASSED SUCCESSFULLY.", 20, yPos);
      }

      doc.save(`Domus_BIM_Report_${floorPlanLayout.id}.pdf`);
      toast.success("PDF Report generated & downloaded successfully!", { id: "pdf-export" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.", { id: "pdf-export" });
    }
  };

  const handleExportDXF = () => {
    if (!floorPlanLayout) return;

    try {
      toast.loading("Generating CAD DXF layout...", { id: "dxf-export" });
      const dxfContent = generateFloorPlanDXF(floorPlanLayout);
      const blob = new Blob([dxfContent], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Domus_Layout_${floorPlanLayout.id}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CAD DXF Layout exported successfully!", { id: "dxf-export" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate DXF drawing.", { id: "dxf-export" });
    }
  };

  const handleExportIFC = () => {
    if (!floorPlanLayout) return;

    try {
      toast.loading("Generating 3D BIM IFC model...", { id: "ifc-export" });
      const ifcContent = generateFloorPlanIFC(floorPlanLayout);
      const blob = new Blob([ifcContent], { type: "application/x-step" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Domus_BIM_Model_${floorPlanLayout.id}.ifc`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("BIM IFC Model exported successfully!", { id: "ifc-export" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate IFC model.", { id: "ifc-export" });
    }
  };

  // Advanced Vendor Matching & Procurement Price Engine
  const getMatchedItems = (): MatchedItem[] => {
    if (!bomReport) return [];
    
    return bomReport.items.map((item) => {
      let vendor: MatchedItem["vendor"] = "Home Depot";
      let sku = "HD-982.11-BLD";
      let unitPrice = 4.50;

      if (item.name.includes("Wall Framing")) {
        vendor = "Home Depot";
        sku = "HD-2x4x8-DFIR";
        unitPrice = 5.25;
      } else if (item.name.includes("Hinge Doors")) {
        vendor = "IKEA";
        sku = "IK-602.115.42";
        unitPrice = 189.00;
      } else if (item.name.includes("Double Pane Windows")) {
        vendor = "Home Depot";
        sku = "HD-L3060-LOWE";
        unitPrice = 249.99;
      } else if (item.name.includes("Gypsum Drywall")) {
        vendor = "Home Depot";
        sku = "HD-12GYP-LITE";
        unitPrice = 14.50;
      } else if (item.name.includes("Søren Lounge Chair") || item.name.includes("Chair")) {
        vendor = "Søren Furniture";
        sku = "SRN-LNGE-CH12";
        unitPrice = 320.00;
      } else if (item.name.includes("Oak Flooring") || item.name.includes("Floor")) {
        vendor = "IKEA";
        sku = "IK-BARK-OAK";
        unitPrice = 6.80;
      } else if (item.name.includes("Paint")) {
        vendor = "Sherwin-Williams";
        sku = "SW-EMERALD-MAT";
        unitPrice = 74.99;
      }

      return {
        category: item.category,
        name: item.name,
        vendor,
        sku,
        unitPrice,
        quantity: item.quantity,
        unit: item.unit,
      };
    });
  };

  const matchedItems = getMatchedItems();
  const grandTotal = matchedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const referralShare = grandTotal * 0.04; // 4% referral kickback

  const handleProcureSubmit = () => {
    setProcureStep("submitting");
    setTimeout(() => {
      setProcureStep("success");
    }, 1800);
  };

  return (
    <aside className="w-full h-full bg-white border border-hairline rounded-2xl flex flex-col shrink-0 overflow-y-auto select-none shadow-card z-20 custom-scrollbar animate-in slide-in-from-right duration-200">
      {/* Header title */}
      <div className="flex items-center justify-between border-b border-hairline p-5 bg-alabaster">
        <div>
          <h2 className="font-jakarta text-[13px] font-800 text-charcoal tracking-tight flex items-center gap-2 uppercase">
            <Sparkles size={14} className="text-indigo" />
            <span>Generative Assessment</span>
          </h2>
          <p className="font-mono text-[9px] text-stone mt-1 tracking-wider uppercase">
            Output Console
          </p>
        </div>
      </div>

      {/* ── 1. LAYOUT TOPOLOGIES ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Accordion.Root type="single" collapsible defaultValue="topologies" className="w-full">
          
          <Accordion.Item value="topologies" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  1. Layout Variants
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        {isGenerating ? (
          <div className="flex flex-col gap-3">
            <div className="h-10 bg-gray-100 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-xl w-full animate-pulse" />
            <div className="h-10 bg-gray-100 rounded-xl w-full animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((idx) => {
              const isActive = activeLayoutIdx === idx;
              const eff = 75 + idx * 5;
              const light = 70 + (4 - idx) * 6;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectLayout(idx)}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-3 transition-all duration-200 outline-none w-full cursor-pointer ${
                    isActive
                      ? "bg-indigo-light border-indigo shadow-sm"
                      : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-jakarta text-xs font-bold text-charcoal">
                      Layout Alternative 0{idx}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-indigo animate-pulse" />
                    )}
                  </div>

                  {/* Tiny scores bar */}
                  <div className="w-full space-y-2 text-[10px] font-body">
                    {/* Efficiency */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-stone">
                        <span>Space Efficiency</span>
                        <span className="font-bold text-charcoal">{eff}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo rounded-full"
                          style={{ width: `${eff}%` }}
                        />
                      </div>
                    </div>

                    {/* Light ratio */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-stone">
                        <span>Natural Illumination</span>
                        <span className="font-bold text-charcoal">{light}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full"
                          style={{ width: `${light}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
            </Accordion.Content>
          </Accordion.Item>

          {/* ── 2. SMART COST & procurement ENGINE (BOM) ────────────────────────── */}
          <Accordion.Item value="bom" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  2. Procurement Cost Sheet
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {bomReport && bomReport.items.length > 0 ? (
              <>
                <div className="space-y-2.5 bg-alabaster border border-hairline rounded-xl p-3 max-h-48 overflow-y-auto">
                  {matchedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 text-[10px] font-body text-charcoal border-b border-hairline/40 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold leading-tight max-w-[150px]">
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-charcoal shrink-0">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[8.5px] text-stone">
                        <span className="font-semibold flex items-center gap-1">
                          <Building size={9} className="text-[#5B6AF0]" />
                          {item.vendor}
                        </span>
                        <span>
                          {item.quantity} {item.unit} &times; ${item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center border-t border-hairline pt-3 font-mono text-[10px]">
                  <span className="font-bold text-charcoal">EST. COST SUMMARY:</span>
                  <span className="font-bold text-charcoal bg-indigo-light text-indigo px-1.5 py-0.5 rounded">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setIsProcuring(true)}
                    className="w-full h-9 bg-charcoal hover:bg-black text-white text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors outline-none cursor-pointer"
                  >
                    <ShoppingCart size={12} />
                    <span>Procure All</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full h-9 bg-white hover:bg-gray-50 border border-hairline text-charcoal text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors outline-none cursor-pointer"
                  >
                    <FileSpreadsheet size={12} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="font-mono text-[9px] text-stone italic text-center p-4 bg-alabaster border border-hairline rounded-xl">
                Awaiting generative layout selection to compile spatial BOM matrix.
              </p>
            )}
            </Accordion.Content>
          </Accordion.Item>

          {/* ── 3. IBC VALIDATION ────────────────────────────────────────── */}
          <Accordion.Item value="compliance" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  3. IBC Validation Check
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {!floorPlanLayout ? (
              <p className="font-mono text-[9px] text-stone italic text-center p-4 bg-alabaster border border-hairline rounded-none">
                IBC rules require geometry calculations.
              </p>
            ) : violations && violations.length > 0 ? (
              violations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-mono"
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <strong className="font-bold block uppercase text-[9px] mb-0.5 text-red-700">
                      {v.code}
                    </strong>
                    <p className="font-medium">{v.message}</p>
                    <p className="text-red-800 font-bold mt-1 text-[9px]">
                      FIX: {v.recommendation}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-900 rounded-xl p-3.5 flex items-center gap-2.5">
                <CheckCircle size={16} className="shrink-0 text-green-600" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  ALL BUILDING RULES MET
                </span>
              </div>
            )}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
      {/* ── 4. EXPORT UTILITIES (Sticky Bottom) ────────────────────────── */}
      <div className="p-5 border-t border-hairline bg-alabaster grid grid-cols-2 gap-2 mt-auto rounded-b-2xl">
        <button
          onClick={handleExportIFC}
          disabled={!floorPlanLayout}
          className="col-span-2 w-full h-10 bg-indigo hover:bg-indigo-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          <Layers size={13} />
          <span>Export 3D BIM (IFC)</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={!floorPlanLayout}
          className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-charcoal text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all outline-none cursor-pointer"
        >
          <FileDown size={13} className="text-stone" />
          <span>PDF Report</span>
        </button>

        <button
          onClick={handleExportDXF}
          disabled={!floorPlanLayout}
          className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-charcoal text-[9px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all outline-none cursor-pointer"
        >
          <FileSpreadsheet size={13} className="text-stone" />
          <span>CAD DXF</span>
        </button>
      </div>

      {/* ── 5. PROCUREMENT MODAL / OVERLAY ─────────────────────────────────────── */}
      {isProcuring && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-hairline p-6 shadow-[0_24px_64px_rgba(0,0,0,0.25)] flex flex-col gap-5 relative">
            <button
              onClick={() => setIsProcuring(false)}
              className="absolute top-4 right-4 w-7 h-7 bg-alabaster border border-hairline rounded-full flex items-center justify-center hover:bg-gray-100 text-stone transition-colors outline-none"
            >
              <X size={14} />
            </button>

            {procureStep === "cart" && (
              <>
                <div className="flex items-center gap-2 border-b border-hairline pb-3">
                  <ShoppingCart className="text-indigo" size={18} />
                  <h3 className="font-jakarta text-sm font-bold text-charcoal uppercase tracking-wider">
                    Supplier Purchasing Desk
                  </h3>
                </div>

                <p className="font-body text-xs text-stone leading-relaxed">
                  The matched SKU catalog splits this procurement sheet directly with Home Depot and IKEA. Reviews active warehouse stock status.
                </p>

                {/* matched inventory list */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto bg-alabaster border border-hairline rounded-xl p-3.5">
                  {matchedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-body border-b border-hairline/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold text-charcoal block">{item.name}</span>
                        <span className="text-[8.5px] text-stone">
                          {item.vendor} &bull; SKU: {item.sku}
                        </span>
                      </div>
                      <span className="font-mono text-stone font-bold text-[9px] shrink-0">
                        {item.quantity} {item.unit} &times; ${item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs border-t border-hairline pt-3 font-body">
                  <div className="flex justify-between text-stone">
                    <span>Order Subtotal:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone">
                    <span>Estimated Shipping (BIM Bulky):</span>
                    <span className="text-success font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-stone">
                    <span>Domus Referral Share (4% Commission):</span>
                    <span className="font-bold text-[#2A7A6E]">${referralShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal font-bold text-sm border-t border-hairline pt-2">
                    <span>Grand Total:</span>
                    <span className="font-mono">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleProcureSubmit}
                  className="w-full h-11 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors outline-none cursor-pointer"
                >
                  <ShoppingCart size={14} />
                  <span>Procure Material Orders (1-Click)</span>
                </button>
              </>
            )}

            {procureStep === "submitting" && (
              <div className="py-12 flex flex-col justify-center items-center gap-4 text-center">
                <LoaderLight />
                <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider mt-2">
                  Contacting Partner APIs...
                </h4>
                <p className="font-body text-[10px] text-stone max-w-xs leading-relaxed">
                  Routing structured order data to Home Depot & IKEA supplier fulfillment gateways. Reserving catalog SKU indices.
                </p>
              </div>
            )}

            {procureStep === "success" && (
              <div className="py-8 flex flex-col justify-center items-center gap-4 text-center space-y-2">
                <div className="w-12 h-12 bg-successLight text-success border border-success/15 rounded-full flex items-center justify-center text-xl font-bold animate-bounce shadow-sm">
                  <Check size={20} />
                </div>
                <h3 className="font-jakarta text-sm font-bold text-charcoal uppercase tracking-wider">
                  Order Successfully Placed!
                </h3>
                <p className="font-body text-xs text-stone max-w-xs leading-relaxed">
                  SKU reservations confirmed. Procurement receipts and tracking details have been logged in your workspace. Referral fee of **${referralShare.toFixed(2)}** credited!
                </p>
                <button
                  onClick={() => setIsProcuring(false)}
                  className="px-6 h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl transition-colors outline-none"
                >
                  Return to Editor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function LoaderLight() {
  return (
    <div className="w-9 h-9 rounded-full border-2 border-indigo/20 border-t-indigo animate-spin" />
  );
}
