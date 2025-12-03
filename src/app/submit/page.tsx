'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Jimp from "jimp";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    console.log('File dropped:', file.name, file.size);

    setLoading(true);
    toast({ title: "Processing...", description: "Watermarking client-side..." });

    try {
      // Load image with Jimp (browser-safe)
      const image = await Jimp.read(URL.createObjectURL(file));
      image.print(
        await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
        10, 10,
        'AI2025'
      );
      const watermarkedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const watermarkedFile = new File([watermarkedBuffer], 'watermarked.png', { type: 'image/png' });
      console.log('Watermarked file ready');

      // Compute hashes in browser (viem keccak)
      const arrayBuffer = await watermarkedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const contentHash = '0x' + Buffer.from(uint8Array).toString('hex'); // Simple hash for demo
      console.log('Content hash:', contentHash);

      // Mock registration (replace with real fetch to VPS /api/register)
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
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Upload failed — check console",
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
