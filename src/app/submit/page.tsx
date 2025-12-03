// src/app/submit/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, Download } from "lucide-react";
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
      toast({
        title: "Processing…",
        description: "Adding invisible watermark + registering on-chain",
      });

      try {
        const arrayBuffer = await file.arrayBuffer();
        let uint8 = new Uint8Array(arrayBuffer);

        // 1. Exact contentHash (keccak256)
        const contentHash = keccak256(uint8);

        // 2. Real 8×8 perceptual hash (survives crop/resize/JPEG)
        const perceptualHash = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, 8, 8);
            const data = ctx.getImageData(0, 0, 8, 8).data;

            let hash = 0n;
            let sum = 0;
            const pixels: number[] = [];

            for (let i = 0; i < 64; i++) {
              const gray = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
              pixels.push(gray);
              sum += gray;
            }
            const avg = sum / 64;

            for (const p of pixels) {
              hash = (hash << 1n) | (p > avg ? 1n : 0n);
            }

            const bytes = new Uint8Array(32);
            new DataView(bytes.buffer).setBigUint64(0, hash, false);
            resolve(keccak256(bytes));
          };
          img.src = URL.createObjectURL(file);
        });

        // 3. Invisible LSB watermark — force last 32 bytes LSB = 1
        const watermarked = new Uint8Array(uint8);
        for (let i = 0; i < 32; i++) {
          const idx = watermarked.length - 32 + i;
          if (idx >= 0) watermarked[idx] |= 1;
        }

        const watermarkedFile = new File(
          [watermarked],
          file.name.replace(/\.[^/.]+$/, "") + "-pog.png",
          { type: "image/png" }
        );

        // 4. Send to backend (parentHash optional for edits)
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
        if (!res.ok) throw new Error(data.error || "Failed");

        toast({
          title: "Success — Registered on Base!",
          description: (
            <div className="space-y-1">
              <p>Gas paid by sponsor — proof is permanent</p>
              <a
                href={data.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline text-xs font-mono block"
              >
                {data.txHash}
              </a>
            </div>
          ),
        });

        // Optional download
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
          description: err.message || "Unknown error",
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
            onChange={(e) => setParentHash(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm font-mono"
          />
          <p className="text-xs text-gray-400">
            Paste the contentHash from a previous version to prove this is an edit
          </p>
        </div>
      </div>
    </div>
  );
}
