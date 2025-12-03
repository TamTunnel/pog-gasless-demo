"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VerifyTab() {
  const [result, setResult] = useState<any>(null);

  const onDrop = async (files: File[]) => {
    if (!files[0]) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    const res = await fetch("https://pog-relay.tamtunnel.workers.dev/verify", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

  return (
    <Card className="p-12">
      <div {...getRootProps()} className="border-4 border-dashed rounded-xl p-16 text-center cursor-pointer hover:border-primary transition">
        <input {...getInputProps()} />
        <p className="text-2xl">Drop any image to verify provenance</p>
      </div>
      {result && (
        <div className="mt-8 p-6 rounded-lg bg-muted">
          <Badge variant={result.signal === "Strong" ? "default" : result.signal === "Medium" ? "secondary" : "destructive"} className="text-2xl px-6 py-3">
            {result.signal || "None"}
          </Badge>
          {result.txHash && <p className="mt-4">Tx: <a href={`https://basescan.org/tx/${result.txHash}`} target="_blank" className="underline">{result.txHash}</a></p>}
        </div>
      )}
    </Card>
  );
}
