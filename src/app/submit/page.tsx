'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { keccak256 } from "viem";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const [downloadChecked, setDownloadChecked] = useState(true);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    const file = acceptedFiles[0];

    setLoading(true);
    toast({ title: "Watermarking...", description: "Adding invisible proof in your browser" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const contentHash = keccak256(uint8);

      // Invisible watermark via LSB steganography
      const watermarked = new Uint8Array(uint8);
      const hashBytes = new Uint8Array(contentHash.slice(2).match(/.{2}/g)!.map(b => parseInt(b, 16)));
      for (let i = 0; i < 32; i++) {
        if (watermarked.length > i + 100) {
          watermarked[watermarked.length - 32 + i] = 
            (watermarked[watermarked.length - 32 + i] & 0xFE) | ((hashBytes[i] >> 7) & 1);
        }
      }

      const watermarkedFile = new File([watermarked], file.name.replace(/\.[^/.]+$/, "") + "-pog.png", {
        type: file.type || "image/png",
      });

      // Send to your real API route
      const formData = new FormData();
      formData.append("file", watermarkedFile);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Success!
      toast({
        title: "Registered on Base — Gas paid by sponsor",
        description: (
          <div className="space-y-2">
            <p>Your image is now provably yours forever.</p>
            <a href={data.explorer} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-xs font-mono">
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
        toast({ title: "Downloaded", description: `${watermarkedFile.name} saved`, duration: 2000 });
      }
    } catch (err: any) {
 N     console.error(err);
      toast({
        title: "Failed",
        description: err.message || "Try another image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, downloadChecked]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 1,
  });

  return (
    <div className="text-center space-y-10">
      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-2xl p-24 cursor-pointer transition-all ${
          isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-24 w-24 text-gray-400 mb-6" />
        <p className="text-3xl font-bold">Drop your AI image here</p>
        <p className="text-muted-foreground mt-4 text-lg">
          Invisible watermark • 100 % gasless • Forever on Base
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Checkbox
          id="download"
          checked={downloadChecked}
          onCheckedChange={(c) => setDownloadChecked(!!c)}
          disabled={loading}
        />
        <Label htmlFor="download" className="cursor-pointer flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download watermarked copy (recommended)
        </Label>
      </div>

      {loading && (
        <div className="flex items-center gap-4 text-xl">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Registering on-chain (gas paid by sponsor)...</span>
        </div>
      )}
    </div>
  );
}
