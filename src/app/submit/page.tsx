'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/register', { // Local endpoint for demo; change to worker URL
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      toast({
        title: "Success! Registered on Base",
        description: (
          <p>
            Tx: <a href={`https://basescan.org/tx/${data.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">View on Basescan</a>
          </p>
        ),
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Upload failed — try again or contact support",
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit & Register</h2>
          <p className="text-gray-500">Drop an AI image — we watermark + register it for free</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
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
          <p className="text-sm text-gray-500 mb-4">Supports PNG, JPG, GIF, WebP (up to 10MB)</p>
        </div>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-lg">Watermarking + registering on Base (gasless)...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
