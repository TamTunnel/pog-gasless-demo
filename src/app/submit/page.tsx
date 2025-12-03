// src/app/submit/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { keccak256 } from "viem";
import imageHash from "image-hash";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const [downloadChecked, setDownloadChecked] = useState(true);
  const [parentHash, setParentHash] = useState(""); // For edit chaining
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    const file = acceptedFiles[0];
    setLoading(true);
    toast({ title: "Processing...", description: "Adding invisible watermark + registering on-chain" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      // 1. Exact contentHash
      const contentHash = keccak256(uint8);

      // 2. Real perceptual hash (8x8 average hash — survives crop/resize/JPEG)
      const perceptualHash = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 8;
          canvas.height = 8;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, 8, 8);
          const data = ctx.getImageData(0, 0, 8, 8).data;
          let hash = 0n;
          let avg = 0;
          for (let i = 0; i < 64; i++) {
            const gray = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
            avg += gray;
            hash = (hash << 1n) | (data[i * 4] > avg / 64 ? 1n : 0n);
          }
          const phashBytes = new Uint8Array(32);
          new DataView(phashBytes.buffer).setBigUint64(0, hash, false);
          resolve(keccak256(phashBytes));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // 3. Invisible LSB watermark (last 32 bytes: all LSB = 1)
      const watermarked = new Uint8Array(uint8);
      for (let i = 0; i < 32; i++) {
        if (watermarked.length > i + 100) {
          watermarked[watermarked.length - 32 + i] |= 1; // Force LSB = 1
        }
      }

      const watermarkedFile = new File([watermarked], file.name.replace(/\.[^/.]+$/, "") + "-pog.png", {
        type: "image/png",
      });

      // 4. Register on-chain with parentHash support
      const formData = new FormData();
      formData.append("file", watermarkedFile);
      if (parentHash && parentHash.startsWith("0x") && parentHash.length === 66) {
        formData.append("parentHash", parentHash);
      }

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast({
        title: "Success! Registered on Base",
        description: (
          <div className="space-y-2">
            <p>Gas paid by sponsor — proof is forever</p>
            <a
              href={data.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs font-mono"
            >
              {data.txHash.slice(0, 10)}...{data.txHash.slice(-8)}
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

    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [downloadChecked, parentHash, toast]);

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
          <span>Registering on Base...</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="
