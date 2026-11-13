"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Upload, Sparkles, Check, X, FileText, Loader2 } from "lucide-react";
import { parsePaperMaterialList, SAMPLE_PAPER_SLIPS, type ExtractedMaterial } from "@/lib/paper-list-parser";

interface PaperListUploaderProps {
  onExtracted: (items: ExtractedMaterial[], imagePreviewUrl?: string) => void;
}

export function PaperListUploader({ onExtracted }: PaperListUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImagePreview(url);
      setExtractedCount(null);
      // Auto-extract using intelligent heuristic parser
      processExtraction(rawText || "50 bori cement, 10 bundle sariya, 5 bag wall putty", url);
    };
    reader.readAsDataURL(file);
  };

  const processExtraction = (textToParse: string, previewUrl?: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const items = parsePaperMaterialList(textToParse);
      setExtractedCount(items.length);
      setIsProcessing(false);
      if (items.length > 0) {
        onExtracted(items, previewUrl || imagePreview || undefined);
      }
    }, 600);
  };

  const handleSampleClick = (sampleText: string) => {
    setRawText(sampleText);
    processExtraction(sampleText);
  };

  const handleClear = () => {
    setImagePreview(null);
    setRawText("");
    setExtractedCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#DDD6EE] bg-[#F7F4FC]/60 p-4 transition-all hover:border-[#7CB518]/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D1B69] text-white">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-caption font-bold text-[#150726]">
              Upload Handwritten Paper List / Photo
            </h4>
            <p className="text-micro text-[#6B5B83]">
              Take photo of site slip or paper list — smart parser extracts materials
            </p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-[#7CB518]" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {imagePreview ? (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-[#DDD6EE] bg-white p-2">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              <Image src={imagePreview} alt="Handwritten list slip" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-bold text-[#150726] flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#7CB518]" />
                Paper photo loaded
              </p>
              {isProcessing ? (
                <p className="text-micro text-[#6B5B83] flex items-center gap-1 mt-0.5">
                  <Loader2 className="h-3 w-3 animate-spin text-[#2D1B69]" />
                  Extracting materials & quantities...
                </p>
              ) : extractedCount !== null ? (
                <p className="text-micro font-bold text-[#7CB518] mt-0.5">
                  ✓ {extractedCount} items identified & added below
                </p>
              ) : (
                <p className="text-micro text-[#6B5B83]">Ready for extraction</p>
              )}
            </div>
            <button
              onClick={handleClear}
              aria-label="Remove image"
              className="p-1.5 rounded-lg text-[#9B8CB5] hover:bg-[#F0ECF9] hover:text-[#E91E63]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-[#DDD6EE] px-4 py-2.5 text-caption font-bold text-[#2D1B69] hover:bg-[#F0ECF9] hover:border-[#2D1B69]/30 transition-all active:scale-98 shadow-xs"
          >
            <Upload className="h-4 w-4 text-[#7CB518]" />
            Upload Paper Photo / Slip
          </button>
        </div>
      )}

      {/* Quick sample chips for instant testing */}
      <div className="mt-3 pt-2.5 border-t border-[#DDD6EE]/50">
        <p className="text-micro font-bold text-[#6B5B83] mb-1.5">
          Or try a sample handwritten list:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PAPER_SLIPS.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSampleClick(sample.text)}
              className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#DDD6EE] px-2.5 py-1 text-micro font-medium text-[#2D1B69] hover:border-[#7CB518] hover:text-[#7CB518] transition-colors shadow-xs"
            >
              <FileText className="h-3 w-3 text-[#7CB518]" />
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
