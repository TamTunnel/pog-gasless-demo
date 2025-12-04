'use client';

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Loader2, Link as LinkIcon, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SuccessState {
    txHash: string;
    explorerUrl: string;
    contentHash: string;
    downloadUrl: string;
    fileName: string;
}

export default function RegisterTab() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<SuccessState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setSuccess(null); // Reset on new file
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
        maxFiles: 1,
    });

    const handleRegister = async () => {
        if (!file) return;

        setLoading(true);
        setSuccess(null);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `Registration failed with status: ${response.status}`;
                try {
                    // Attempt to parse a JSON error response from the server
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // This catch block will execute if the error response is not valid JSON (e.g., an image file or HTML error page)
                    console.error("Could not parse error response as JSON", e);
                    errorMessage = "An unexpected error occurred on the server.";
                }
                throw new Error(errorMessage);
            }
            
            const watermarkedImageData = await response.arrayBuffer();
            const txHash = response.headers.get('x-tx-hash');
            const explorerUrl = response.headers.get('x-explorer-url');
            const contentHash = response.headers.get('x-content-hash');

            if (!txHash || !explorerUrl || !contentHash) {
                throw new Error("Missing critical transaction data in response headers.");
            }

            const blob = new Blob([watermarkedImageData], { type: file.type });
            const downloadUrl = URL.createObjectURL(blob);
            const fileName = `watermarked_${file.name}`;

            setSuccess({ txHash, explorerUrl, contentHash, downloadUrl, fileName });
            toast({
                title: "Registration Successful",
                description: "Your image has been watermarked and registered on-chain.",
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred.");
            toast({
                title: "Registration Failed",
                description: err.message, 
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-700 text-white">
            <CardContent className="p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Register Proof of Generation</h2>
                    <p className="text-gray-400">Upload any image to apply a secure watermark and register its proof on the blockchain.</p>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                        isDragActive
                            ? 'border-green-500 bg-green-900/30'
                            : file ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-800/20'
                    }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    {file ? (
                        <p className="text-lg font-medium text-gray-300">Selected: {file.name}</p>
                    ) : (
                        <p className="text-lg font-medium mb-2">
                            {isDragActive ? 'Drop the image here...' : 'Drag & drop an image, or click to select'}
                        </p>
                    )}
                    <p className="text-sm text-gray-500">We'll apply a unique, invisible watermark to your image.</p>
                </div>

                {file && !loading && !success && (
                    <div className="mt-8 text-center">
                        <Button onClick={handleRegister} size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold">
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Register & Watermark Image
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                            <p className="text-lg text-gray-300">Applying watermark & submitting to blockchain...</p>
                        </div>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive" className="mt-8 bg-red-900/30 border-red-500/50 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Registration Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <div className="mt-8 space-y-6 bg-gray-800/50 p-6 rounded-lg">
                        <Alert className="bg-green-900/30 border-green-500/50 text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>
                                Your image is now securely registered.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href={success.downloadUrl} download={success.fileName} className="flex-1">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
                                    <Download className="mr-2 h-5 w-5" />
                                    Download Watermarked Image
                                </Button>
                            </a>
                            <a href={success.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button variant="outline" className="w-full border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white" size="lg">
                                    <LinkIcon className="mr-2 h-5 w-5" />
                                    View on Blockchain
                                </Button>
                            </a>
                        </div>
                        <div className="text-xs text-gray-400 font-mono bg-gray-900/50 p-3 rounded">
                            <p><strong>Content Hash:</strong> {success.contentHash}</p>
                            <p><strong>Transaction Hash:</strong> {success.txHash}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
