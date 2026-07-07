"use client";

import { useState } from "react";
import { Bot, Sparkles, Package, FileText, Scale, Users, Mic, RefreshCw } from "lucide-react";
import { useAIMaterialRecommendation, useAIBOQReader, useAIQuoteComparison, useAIVendorMatching, useAIProcurementAssistant, useAIVoiceOrder, useAISmartReorder } from "../lib/modit-api";
import { Button, Input, Textarea, Select, Card, CardContent } from "@/lib/modit-ui";
import { cn } from "@/lib/utils";

export function ModitAIAssistant() {
  const [activeTab, setActiveTab] = useState<"assistant" | "recommendation" | "boq" | "quote" | "vendor" | "voice" | "reorder">("assistant");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rfqId, setRfqId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget] = useState("");
  const [requirements, setRequirements] = useState("");
  const [boqFileUrl, setBoqFileUrl] = useState("");
  const [vendorProductId, setVendorProductId] = useState("");
  const [vendorQuantity, setVendorQuantity] = useState("");
  const [vendorLocation, setVendorLocation] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [reorderOrgId, setReorderOrgId] = useState("");

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
    { id: "assistant" as const, label: "Assistant", icon: Bot },
    { id: "recommendation" as const, label: "Materials", icon: Package },
    { id: "boq" as const, label: "BOQ Reader", icon: FileText },
    { id: "quote" as const, label: "Quote", icon: Scale },
    { id: "vendor" as const, label: "Vendors", icon: Users },
    { id: "voice" as const, label: "Voice", icon: Mic },
    { id: "reorder" as const, label: "Reorder", icon: RefreshCw },
  ];

  return (
    <Card>
      <div className="border-b border-[var(--border-subtle)]">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="p-6">
        {activeTab === "assistant" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Ask AI Assistant</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about procurement, inventory, suppliers..."
                rows={4}
              />
            </div>
            <Button
              onClick={() => handleAICall(() => aiAssistant.mutateAsync({ message } as never), "AI assistant is currently unavailable. Please try again later.")}
              disabled={aiAssistant.isPending || !message}
            >
              {aiAssistant.isPending ? "Processing..." : "Ask"}
            </Button>
            {aiError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {aiAssistant.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Response</h4>
                <p className="text-[var(--text-secondary)]">{(aiAssistant.data as any)?.answer || "No response available"}</p>
                {(aiAssistant.data as any)?.suggested_actions && (aiAssistant.data as any).suggested_actions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Suggested Actions</h5>
                    <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                      {(aiAssistant.data as any).suggested_actions.map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "recommendation" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Project Type</label>
              <Input
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="e.g., residential, commercial"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Budget (₹)</label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="1000000" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Requirements</label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe your material requirements..."
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleAICall(() => materialRecommendation.mutateAsync({ project_type: projectType || "residential", budget: Number(budget) || 1000000, requirements: requirements || "Cement and steel" } as never), "Material recommendation is currently unavailable.")}
              disabled={materialRecommendation.isPending}
            >
              {materialRecommendation.isPending ? "Analyzing..." : "Get Recommendations"}
            </Button>
            {aiError && activeTab === "recommendation" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {materialRecommendation.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Recommended Materials</h4>
                <div className="space-y-2">
                  {(materialRecommendation.data as any)?.recommendations?.slice(0, 5).map((rec: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--text-primary)]">{rec.name}</span>
                      <span className="text-[var(--text-secondary)]">₹{rec.list_price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-[var(--text-secondary)]">
                  Estimated Cost: ₹{(materialRecommendation.data as any)?.estimated_cost}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "boq" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Project ID</label>
              <Input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter project ID"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">BOQ File URL</label>
              <Input
                type="url"
                value={boqFileUrl}
                onChange={(e) => setBoqFileUrl(e.target.value)}
                placeholder="https://example.com/boq.pdf"
              />
            </div>
            <Button
              onClick={() => handleAICall(() => boqReader.mutateAsync({ file_url: boqFileUrl || "https://example.com/boq.pdf", project_id: projectId } as never), "BOQ reader is currently unavailable.")}
              disabled={boqReader.isPending || !projectId}
            >
              {boqReader.isPending ? "Processing..." : "Read BOQ"}
            </Button>
            {aiError && activeTab === "boq" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {boqReader.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Extracted Items</h4>
                <div className="space-y-2">
                  {(boqReader.data as any)?.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--text-primary)]">{item.product_name}</span>
                      <span className="text-[var(--text-secondary)]">
                        {item.quantity} {item.unit} × ₹{item.estimated_rate}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-[var(--text-secondary)]">
                  Total Estimated Cost: ₹{(boqReader.data as any)?.total_estimated_cost}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "quote" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">RFQ ID</label>
              <Input
                value={rfqId}
                onChange={(e) => setRfqId(e.target.value)}
                placeholder="Enter RFQ ID"
              />
            </div>
            <Button
              onClick={() => handleAICall(() => quoteComparison.mutateAsync({ rfq_id: rfqId } as never), "Quote comparison is currently unavailable.")}
              disabled={quoteComparison.isPending || !rfqId}
            >
              {quoteComparison.isPending ? "Analyzing..." : "Compare Quotes"}
            </Button>
            {aiError && activeTab === "quote" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {quoteComparison.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Comparison Results</h4>
                <p className="text-sm text-[var(--text-secondary)]">{(quoteComparison.data as any)?.analysis || "No analysis available"}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "vendor" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Product ID</label>
              <Input
                value={vendorProductId}
                onChange={(e) => setVendorProductId(e.target.value)}
                placeholder="Enter product ID"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Quantity</label>
              <Input
                value={vendorQuantity}
                onChange={(e) => setVendorQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Location</label>
              <Input
                value={vendorLocation}
                onChange={(e) => setVendorLocation(e.target.value)}
                placeholder="e.g., Delhi, Mumbai"
              />
            </div>
            <Button
              onClick={() => handleAICall(() => vendorMatching.mutateAsync({ product_id: vendorProductId, quantity: Number(vendorQuantity) || 100, location: vendorLocation || "Delhi" } as never), "Vendor matching is currently unavailable.")}
              disabled={vendorMatching.isPending || !vendorProductId}
            >
              {vendorMatching.isPending ? "Matching..." : "Find Vendors"}
            </Button>
            {aiError && activeTab === "vendor" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {vendorMatching.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Recommended Vendors</h4>
                <p className="text-sm text-[var(--text-secondary)]">{(vendorMatching.data as any)?.recommendations || "No vendors found"}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Voice Transcript</label>
              <Textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="e.g., Order 50 bags of cement and 10 TMT bars"
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleAICall(() => voiceOrder.mutateAsync({ transcript: voiceTranscript } as never), "Voice order is currently unavailable.")}
              disabled={voiceOrder.isPending || !voiceTranscript}
            >
              {voiceOrder.isPending ? "Processing..." : "Process Order"}
            </Button>
            {aiError && activeTab === "voice" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {voiceOrder.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Order Summary</h4>
                <p className="text-sm text-[var(--text-secondary)]">{(voiceOrder.data as any)?.summary || "No summary available"}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reorder" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Organization ID</label>
              <Input
                value={reorderOrgId}
                onChange={(e) => setReorderOrgId(e.target.value)}
                placeholder="Enter organization ID"
              />
            </div>
            <Button
              onClick={() => handleAICall(() => smartReorder.mutateAsync({ organization_id: reorderOrgId } as never), "Smart reorder is currently unavailable.")}
              disabled={smartReorder.isPending || !reorderOrgId}
            >
              {smartReorder.isPending ? "Analyzing..." : "Get Reorder Suggestions"}
            </Button>
            {aiError && activeTab === "reorder" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                {aiError}
              </div>
            )}
            {smartReorder.data && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-4">
                <h4 className="mb-2 font-semibold text-[var(--text-primary)]">Suggested Reorders</h4>
                <p className="text-sm text-[var(--text-secondary)]">{(smartReorder.data as any)?.suggestions || "No suggestions available"}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
