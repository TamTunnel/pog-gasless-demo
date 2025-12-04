'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, CheckCircle, Loader2, Hash, Bot, Fingerprint, Calendar, Info, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function VerificationDetails({ proof }: { proof: any }) {
    if (!proof) return null;
    
    const explorerUrl = `https://basescan.org/tx/${proof.txHash}`;

    return (
        <div className="mt-6 bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">On-Chain Proof Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-300">Tool</p>
                        <p className="text-gray-100 font-mono text-xs">{proof.tool || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-300">Model</p>
                        <p className="text-gray-100 font-mono text-xs">{proof.model || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-300">Registered On</p>
                        <p className="text-gray-100 font-mono text-xs">{proof.timestamp || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-300">Transaction Hash</p>
                        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono text-xs break-all">
                            {proof.txHash}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyTab() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
          let errorMessage;
          try {
              const errorResponse = response.clone();
              const errorData = await errorResponse.json();
              errorMessage = errorData.error || `API Error: ${response.status}`;
          } catch (e) {
              errorMessage = await response.text();
          }
          throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: "Verification Complete",
        description: data.signal,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred.");
      toast({
        title: "Verification Failed",
        description: err.message,
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
    <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-700 text-white">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Verify Provenance</h2>
          <p className="text-gray-400">Drop any image to check for an AI watermark and its on-chain registration.</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-green-500 bg-green-900/30'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/20'
          }`}
        >
          <input {...getInputProps()} />
          <Search className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop the image here...' : 'Drag & drop an image, or click to select'}
          </p>
          <p className="text-sm text-gray-500">We check for both the PoG watermark and its blockchain proof.</p>
        </div>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-green-400" />
              <p className="text-lg text-gray-300">Analyzing image and querying blockchain...</p>
            </div>
          </div>
        )}

        {error && (
            <Alert variant="destructive" className="mt-8 bg-red-900/30 border-red-500/50 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {result && !error && (
          <div className="mt-8 space-y-4">
            <Alert className={`${
                result.signal.startsWith("Strong") ? "border-green-500/50 bg-green-900/30 text-green-200" : 
                result.signal.startsWith("Medium") ? "border-yellow-500/50 bg-yellow-900/30 text-yellow-200" : 
                "border-red-500/50 bg-red-900/30 text-red-200"
            }`}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Verification Result</AlertTitle>
              <AlertDescription className="font-semibold">
                {result.signal}
              </AlertDescription>
            </Alert>

            {result.onChainProof && <VerificationDetails proof={result.onChainProof} />}

            {result.watermark_detected && !result.onChainProof && (
                <div className="flex items-start gap-3 mt-4 pt-4 ">
                    <Info className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        <strong>Note:</strong> An on-chain proof was not found in recent blocks (approx. the last hour). For older registrations, you may need to search for the image's content hash directly on a block explorer.
                    </p>
                </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
