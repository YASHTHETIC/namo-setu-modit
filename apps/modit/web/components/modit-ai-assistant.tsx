"use client";

import { useState } from "react";
import { useAIMaterialRecommendation, useAIBOQReader, useAIQuoteComparison, useAIVendorMatching, useAIProcurementAssistant, useAIVoiceOrder, useAISmartReorder } from "../lib/modit-api";

export function ModitAIAssistant() {
  const [activeTab, setActiveTab] = useState<"assistant" | "recommendation" | "boq" | "quote" | "vendor" | "voice" | "reorder">("assistant");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rfqId, setRfqId] = useState("");

  const aiAssistant = useAIProcurementAssistant();
  const materialRecommendation = useAIMaterialRecommendation();
  const boqReader = useAIBOQReader();
  const quoteComparison = useAIQuoteComparison();
  const vendorMatching = useAIVendorMatching();
  const voiceOrder = useAIVoiceOrder();
  const smartReorder = useAISmartReorder();

  const [aiError, setAiError] = useState<string | null>(null);

  const handleAICall = async (fn: () => Promise<any>, fallbackMessage: string) => {
    setAiError(null);
    try {
      await fn();
    } catch {
      setAiError(fallbackMessage);
    }
  };

  const tabs = [
    { id: "assistant" as const, label: "Procurement Assistant" },
    { id: "recommendation" as const, label: "Material Recommendation" },
    { id: "boq" as const, label: "BOQ Reader" },
    { id: "quote" as const, label: "Quote Comparison" },
    { id: "vendor" as const, label: "Vendor Matching" },
    { id: "voice" as const, label: "Voice Order" },
    { id: "reorder" as const, label: "Smart Reorder" },
  ];

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "assistant" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Ask AI Assistant</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about procurement, inventory, suppliers..."
                className="w-full rounded-lg border px-4 py-2"
                rows={4}
              />
            </div>
            <button
              onClick={() => handleAICall(() => aiAssistant.mutateAsync({ message } as any), "AI assistant is currently unavailable. Please try again later.")}
              disabled={aiAssistant.isPending || !message}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {aiAssistant.isPending ? "Processing..." : "Ask"}
            </button>
            {aiError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {aiAssistant.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Response</h4>
                <p className="text-slate-700">{(aiAssistant.data as any)?.answer || "No response available"}</p>
                {(aiAssistant.data as any)?.suggested_actions && (aiAssistant.data as any).suggested_actions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="mb-2 text-sm font-medium text-slate-900">Suggested Actions</h5>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                      {(aiAssistant.data as any).suggested_actions.map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "recommendation" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Project Type</label>
              <input
                type="text"
                placeholder="e.g., residential, commercial"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Budget (₹)</label>
              <input type="number" placeholder="1000000" className="w-full rounded-lg border px-4 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Requirements</label>
              <textarea
                placeholder="Describe your material requirements..."
                className="w-full rounded-lg border px-4 py-2"
                rows={3}
              />
            </div>
            <button
              onClick={() => handleAICall(() => materialRecommendation.mutateAsync({ project_type: "residential", budget: 1000000, requirements: "Cement and steel" } as any), "Material recommendation is currently unavailable.")}
              disabled={materialRecommendation.isPending}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {materialRecommendation.isPending ? "Analyzing..." : "Get Recommendations"}
            </button>
            {aiError && activeTab === "recommendation" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {materialRecommendation.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Recommended Materials</h4>
                <div className="space-y-2">
                  {(materialRecommendation.data as any)?.recommendations?.slice(0, 5).map((rec: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-900">{rec.name}</span>
                      <span className="text-slate-600">₹{rec.list_price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  Estimated Cost: ₹{(materialRecommendation.data as any)?.estimated_cost}
                </div>
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "boq" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Project ID</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter project ID"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">BOQ File URL</label>
              <input
                type="url"
                placeholder="https://example.com/boq.pdf"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            <button
              onClick={() => handleAICall(() => boqReader.mutateAsync({ file_url: "https://example.com/boq.pdf", project_id: projectId } as any), "BOQ reader is currently unavailable.")}
              disabled={boqReader.isPending || !projectId}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {boqReader.isPending ? "Processing..." : "Read BOQ"}
            </button>
            {aiError && activeTab === "boq" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {boqReader.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Extracted Items</h4>
                <div className="space-y-2">
                  {(boqReader.data as any)?.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-900">{item.product_name}</span>
                      <span className="text-slate-600">
                        {item.quantity} {item.unit} × ₹{item.estimated_rate}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  Total Estimated Cost: ₹{(boqReader.data as any)?.total_estimated_cost}
                  <br />
                  Confidence: {((boqReader.data as any)?.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "quote" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">RFQ ID</label>
              <input
                value={rfqId}
                onChange={(e) => setRfqId(e.target.value)}
                placeholder="Enter RFQ ID"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>
            <button
              onClick={() => handleAICall(() => quoteComparison.mutateAsync(rfqId), "Quote comparison is currently unavailable.")}
              disabled={quoteComparison.isPending || !rfqId}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {quoteComparison.isPending ? "Comparing..." : "Compare Quotes"}
            </button>
            {aiError && activeTab === "quote" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {quoteComparison.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Quote Comparison</h4>
                <div className="space-y-2">
                  {(quoteComparison.data as any)?.comparison?.map((quote: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-900">{quote.quotation_number}</span>
                      <span className="text-slate-600">₹{quote.grand_total}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  Savings Potential: ₹{(quoteComparison.data as any)?.savings_potential}
                </div>
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "vendor" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Product ID</label>
              <input type="text" placeholder="Enter product ID" className="w-full rounded-lg border px-4 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Quantity</label>
              <input type="number" placeholder="100" className="w-full rounded-lg border px-4 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Location</label>
              <input type="text" placeholder="City, State" className="w-full rounded-lg border px-4 py-2" />
            </div>
            <button
              onClick={() => handleAICall(() => vendorMatching.mutateAsync({ product_id: "prod-1", quantity: 100, location: "Mumbai" } as any), "Vendor matching is currently unavailable.")}
              disabled={vendorMatching.isPending}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {vendorMatching.isPending ? "Matching..." : "Find Vendors"}
            </button>
            {aiError && activeTab === "vendor" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {vendorMatching.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Matched Vendors</h4>
                <div className="space-y-2">
                  {(vendorMatching.data as any)?.matched_vendors?.slice(0, 3).map((vendor: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium text-slate-900">{vendor.supplier_code}</div>
                      <div className="text-slate-600">Rating: {vendor.rating}/5</div>
                      <div className="text-slate-600">Delivery: {vendor.estimated_delivery}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Voice Order</label>
              <textarea
                placeholder="Speak or type your order..."
                className="w-full rounded-lg border px-4 py-2"
                rows={3}
              />
            </div>
            <button
              onClick={() => handleAICall(() => voiceOrder.mutateAsync({ transcript: "Order 50 bags of cement", organization_id: "org-1" } as any), "Voice order processing is currently unavailable.")}
              disabled={voiceOrder.isPending}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {voiceOrder.isPending ? "Processing..." : "Process Order"}
            </button>
            {aiError && activeTab === "voice" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {voiceOrder.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Order Items</h4>
                <div className="space-y-2">
                  {(voiceOrder.data as any)?.order_items?.map((item: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="text-slate-900">{item.product_name}</span>
                      <span className="text-slate-600">: {item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  Confidence: {((voiceOrder.data as any)?.confidence * 100).toFixed(0)}%
                </div>
                <p className="mt-2 text-sm text-slate-700">{(voiceOrder.data as any)?.confirmation_message}</p>
              </div>
            ) as any}
          </div>
        )}

        {activeTab === "reorder" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Organization ID</label>
              <input type="text" placeholder="Enter organization ID" className="w-full rounded-lg border px-4 py-2" />
            </div>
            <button
              onClick={() => handleAICall(() => smartReorder.mutateAsync({ organization_id: "org-1" } as any), "Smart reorder is currently unavailable.")}
              disabled={smartReorder.isPending}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {smartReorder.isPending ? "Analyzing..." : "Get Reorder Suggestions"}
            </button>
            {aiError && activeTab === "reorder" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {smartReorder.data && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 font-semibold text-slate-900">Reorder Suggestions</h4>
                <div className="space-y-2">
                  {(smartReorder.data as any)?.reorder_suggestions?.slice(0, 5).map((suggestion: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-900">{suggestion.product_name}</span>
                      <span className="text-slate-600">
                        {suggestion.current_stock} → {suggestion.suggested_quantity} ({suggestion.urgency})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  Total Estimated Cost: ₹{(smartReorder.data as any)?.total_estimated_cost}
                </div>
              </div>
            ) as any}
          </div>
        )}
      </div>
    </div>
  );
}
