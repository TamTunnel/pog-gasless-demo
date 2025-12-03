"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function SubmitTab() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = async (files: File[]) => {
    if (!files[0]) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const res = await fetch("https://pog-relay.tamtunnel.workers.dev/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.txHash) {
        toast({
          title: "Success! Registered on Base",
          description: <>Tx: <a href={`https://basescan.org/tx/${data.txHash}`} target="_blank" className="underline">{data.txHash.slice(0,10)}...</a></>,
        });
      }
    } catch (e) {
      toast({ title: "Error", description: "Try again later", variant: "destructive" });
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

  return (
    <Card className="p-12">
      <div {...getRootProps()} className="border-4 border-dashed rounded-xl p-16 text-center cursor-pointer hover:border-primary transition">
        <input {...getInputProps()} />
        {isDragActive ? <p className="text-2xl">Drop your AI image here...</p> : <p className="text-2xl">Drag & drop an AI image or click to upload</p>}
        <p className="text-muted-foreground mt-4">We will invisibly watermark + register it on Base for free</p>
      </div>
      {loading && <p className="text-center mt-8 text-xl">Processing & registering (gasless)...</p>}
    </Card>
  );
}
