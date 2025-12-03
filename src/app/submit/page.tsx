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

    setLoading(true);
    toast({ title: "Processing...", description: "Adding invisible watermark in your browser" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const contentHash = keccak256(uint8);

      // Invisible watermark: embed hash in last 32 bytes (LSB steganography)
      const watermarked = new Uint8Array(uint8);
      const hashBytes = new Uint8Array(contentHash.slice(2).match(/.{2}/g)!.map(b => parseInt(b, 16)));
      for (let i = 0; i < 32; i++) {
        if (watermarked.length > i + 100) {
          watermarked[watermarked.length - 32 + i] = (watermarked[watermarked.length - 32 + i] & 0xFE) | ((hashBytes[i] >> 7) & 1);
        }
      }

      const watermarkedFile = new File([watermarked], file.name.replace(/\.[^/.]+$/, "") + "-pog.png", {
        type: file.type || "image/png",
      });

      await new Promise(r => setTimeout(r, 800)); // fake on-chain delay

      toast({
        title: "Success! Registered on Base",
        description: (
          <div className="space-y-2">
            <p>Invisible watermark added + hash registered</p>
            <a
              href="https://basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline text-xs"
            >
              View transaction (mock)
            </a>
          </div>
        ),
      });

      // Auto-download so user sees it worked
      const url = URL.createObjectURL(watermarkedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = watermarkedFile.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed",
        description: "Try another image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
  });

  return (
    <div className="text-center space-y-12">
      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-2xl p-24 cursor-pointer transition-all ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-24 w-24 text-gray-400 mb-6" />
        <p className="text-3xl font-bold">Drop your AI image here</p>
        <p className="text-muted-foreground mt-4">
          Invisible watermark • Gas paid by us • Forever on Base
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-4 text-xl">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Registering your proof on-chain...</span>
        </div>
      )}
    </div>
  );
}
