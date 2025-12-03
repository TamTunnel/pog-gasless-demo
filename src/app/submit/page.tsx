'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Jimp from "jimp/browser/lib/jimp"; // ← THIS IS THE CORRECT BROWSER IMPORT

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    console.log("File dropped:", file.name, file.size);

    setLoading(true);
    toast({ title: "Watermarking...", description: "Adding invisible proof..." });

    try {
      // CORRECT WAY TO USE JIMP IN BROWSER
      const image = await Jimp.read(URL.createObjectURL(file));
      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      image.print(font, 50, 50, "AI2025", 0.3); // semi-transparent
      const watermarkedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const watermarkedFile = new File([watermarkedBuffer], "watermarked.png", { type: "image/png" });

      console.log("Watermarked file ready:", watermarkedFile.size, "bytes");

      // Mock success (replace later with real /api/register)
      const mockTx = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      toast({
        title: "Success! Registered on Base",
        description: (
          <div className="space-y-2">
            <p>Your image is now provably yours.</p>
            <a
              href={`https://basescan.org/tx/${mockTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              View mock transaction
            </a>
          </div>
        ),
      });
    } catch (error: any) {
      console.error("Watermark failed:", error);
      toast({
        title: "Failed",
        description: error.message || "Try a smaller PNG/JPG",
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
        className={`border-4 border-dashed rounded-xl p-16 cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <p className="text-xl font-semibold">
          {isDragActive ? "Drop it here" : "Drag & drop your AI image"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          We watermark it in your browser + register for free (you pay nothing)
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 text-lg">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Watermarking + registering on-chain...</span>
        </div>
      )}
    </div>
  );
}
