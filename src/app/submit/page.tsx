// src/app/submit/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { keccak256 } from "viem";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const [downloadChecked, setDownloadChecked] = useState(true);
  const [parentHash, setParentHash] = useState("");
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setLoading(true);
      toast({ title: "Processing…", description: "Adding watermark + registering on-chain" });

      try {
        const arrayBuffer = await file.arrayBuffer();
        let uint8 = new Uint8Array(arrayBuffer);

        // Exact contentHash
        const contentHash = keccak256(uint8);

// In onDrop function — replace the watermark section with this:
const watermarked = new Uint8Array(uint8);

// Force last 32 bytes to have LSB = 1
const startIdx = Math.max(0, watermarked.length - 32);
for (let i = startIdx; i < watermarked.length; i++) {
  watermarked[i] = watermarked[i] | 1;
}

        const watermarkedFile = new File(
          [watermarked],
          file.name.replace(/\.[^/.]+$/, "") + "-pog.png",
          { type: "image/png" }
        );

        // Send to backend
        const formData = new FormData();
        formData.append("file", watermarkedFile);
        if (parentHash && /^0x[a-fA-F0-9]{64}$/.test(parentHash)) {
          formData.append("parentHash", parentHash);
        }

        const res = await fetch("/api/register", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        toast({
          title: "Success — Registered on Base!",
          description: (
            <div className="space-y-1">
              <p>Gas paid by sponsor — proof is permanent</p>
              <a
                href={data.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline text-xs font-mono block break-all"
              >
                {data.txHash}
              </a>
            </div>
          ),
        });

        if (downloadChecked) {
          const url = URL.createObjectURL(watermarkedFile);
          const a = document.createElement("a");
          a.href = url;
          a.download = watermarkedFile.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err: any) {
        toast({
          title: "Failed",
          description: err.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [downloadChecked, parentHash, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg">
          {isDragActive ? "Drop your AI image here" : "Drag & drop an AI image, or click to select"}
        </p>
        <p className="text-sm text-gray-400 mt-2">Free on-chain registration (sponsor pays gas)</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Registering on Base…</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="download"
            checked={downloadChecked}
            onCheckedChange={(c) => setDownloadChecked(c as boolean)}
          />
          <Label htmlFor="download">Download watermarked copy</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent">Parent contentHash (for edits — optional)</Label>
          <input
            id="parent"
            type="text"
            placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
            value={parentHash}
            onChange={(e) => setParentHash(e.target.value.trim())}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-gray-400">
            Paste contentHash from previous version to prove this is an edit
          </p>
        </div>
      </div>
    </div>
  );
}
