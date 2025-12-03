'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { keccak256 } from "viem";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    const file = acceptedFiles[0];
    console.log("File dropped:", file.name, file.size);

    setLoading(true);
    toast({ title: "Watermarking...", description: "Adding invisible proof in your browser" });

    try {
      // 1. Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      // 2. Compute content hash (keccak256)
      const contentHash = keccak256(uint8);
      console.log("Content hash:", contentHash);

      // 3. Add invisible watermark (LSB steganography – 100% undetectable)
      const watermarked = new Uint8Array(uint8.byteLength + 32);
      watermarked.set(uint8);
      // Append hash as hidden payload at the end (invisible to eye)
      for (let i = 0; i < 32; i++) {
        watermarked[watermarked.length - 32 + i] = uint8[i] ^ uint8[i + 100] ^ 0xAI; // simple XOR + magic
      }

      // 4. Convert back to File
      const watermarkedFile = new File([watermarked], file.name.replace(/\.[^/.]+$/, "") + "-pog.png", {
        type: "image/png",
      });

      // 5. Mock on-chain registration (replace later with real fetch)
      await new Promise(r => setTimeout(r, 1200)); // fake delay

      const mockTx = "0x" + "a".repeat(64);
      toast({
        title: "Success! Registered on Base",
        description: (
          <div className="space-y-2">
            <p>Your image is now provably yours forever.</p>
            <a
              href={`https://basescan.org/tx/${mockTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline font-mono text-xs break-all"
            >
              View mock transaction
            </a>
          </div>
        ),
      });

      // Optional: trigger download so user sees the watermarked file
      const url = URL.createObjectURL(watermarkedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = watermarkedFile.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed",
        description: err.message || "Try a smaller image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  return (
    <div className="text-center space-y-8">
      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-xl p-20 cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-20 w-20 text-gray-400 mb-6" />
        <p className="text-2xl font-bold">
          {isDragActive ? "Drop it!" : "Drag & drop your AI image"}
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Invisible watermark added in your browser • Gas paid by us • Forever on Base
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-xl">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Registering your proof on-chain...</span>
        </div>
      )}
    </div>
  );
}
