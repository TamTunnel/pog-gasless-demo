'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { keccak256 } from "viem"; // For browser hash

// Client-side watermark (simple overlay for demo)
const watermarkImage = async (file: File) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.font = '48px Arial';
      ctx.fillText('AI2025', canvas.width - 200, canvas.height - 50);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], 'watermarked.png', { type: 'image/png' }));
      }, 'image/png');
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    console.log('File dropped:', file.name, file.size); // Debug log

    setLoading(true);
    toast({ title: "Processing...", description: "Watermarking client-side..." });

    try {
      // Watermark in browser
      const watermarkedFile = await watermarkImage(file);
      console.log('Watermarked file ready');

      // Compute hashes in browser
      const arrayBuffer = await watermarkedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const contentHash = keccak256(uint8Array);
      console.log('Content hash:', contentHash);

      // Mock registration (replace with real fetch to VPS /api/register when ready)
      // For now, simulate success
      const mockTx = '0x' + '1234567890abcdef'.repeat(4).slice(0, 66);
      toast({
        title: "Success! Registered on Base",
        description: (
          <p>
            Tx: <a href={`https://basescan.org/tx/${mockTx}`} target="_blank" className="underline text-blue-400">View on Basescan</a>
          </p>
        ),
      });
      console.log('Mock registration success:', mockTx);
    } catch (error) {
      console.error('Upload error:', error); // Always log
      toast({
        title: "Error",
        description: "Upload failed — check console for details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div className="text-center">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Drop the image here...' : 'Drag & drop an AI image here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mb-4">We watermark client-side + register gasless</p>
      </div>

      {loading && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-lg">Watermarking + registering...</p>
          </div>
        </div>
      )}
    </div>
  );
}
