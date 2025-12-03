'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function VerifyTab() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/verify', { // Local endpoint; change to worker
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();
      setResult(data);
      toast({
        title: "Verification Complete",
        description: data.signal || "No signal detected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Verification failed — try again",
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
          <h2 className="text-3xl font-bold mb-2">Verify Provenance</h2>
          <p className="text-gray-500">Drop any image to check for AI watermark + on-chain registration</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-green-500 bg-green-50 dark:bg-green-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop the image here...' : 'Drag & drop any image here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mb-4">We check for PoG watermark + blockchain registration</p>
        </div>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              <p className="text-lg">Analyzing image...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold text-lg mb-2">{result.signal || "No Signal"}</div>
                <div className="text-sm space-y-1">
                  <p><strong>Watermark:</strong> {result.watermark_detected ? "Detected" : "Not found"}</p>
                  <p><strong>PoG Events:</strong> {result.pog_events_found}</p>
                  {result.txHash && <p><strong>Tx:</strong> <a href={`https://basescan.org/tx/${result.txHash}`} target="_blank" className="underline">View</a></p>}
                </div>
              </AlertDescription>
            </Alert>
            {result.warning && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.warning}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
