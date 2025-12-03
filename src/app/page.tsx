'use client';

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SubmitTab from "./submit/page";
import VerifyTab from "./verify/page";

export default function Home() {
  const [activeTab, setActiveTab] = useState("submit");

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          PoG Gasless Demo
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Fully open-source, privacy-first, blockchain-based AI verification registry
        </p>
        <p className="mt-4 text-lg text-gray-400">
          Drop an AI image → We watermark + register it on Base for <strong>free</strong>
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800 rounded-xl p-2">
          <TabsTrigger value="submit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Submit & Register (Free)
          </TabsTrigger>
          <TabsTrigger value="verify" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Verify Any Image
          </TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="w-full">
          <SubmitTab />
        </TabsContent>
        <TabsContent value="verify" className="w-full">
          <VerifyTab />
        </TabsContent>
      </Tabs>

      {/* Comparison Table */}
      <section className="mt-16 w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Advantages vs Everything Else</h2>
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">PoG v2 (us)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">C2PA (Adobe etc.)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Closed commercial tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Open source</td>
                  <td className="px-6 py-4 text-center text-green-400">Yes</td>
                  <td className="px-6 py-4 text-center text-yellow-400">Partially</td>
                  <td className="px-6 py-4 text-center text-red-400">No</td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Works today</td>
                  <td className="px-6 py-4 text-center text-green-400">Yes</td>
                  <td className="px-6 py-4 text-center text-yellow-400">Mostly future</td>
                  <td className="px-6 py-4 text-center text-green-400">Yes (paid)</td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Costs ~$0.001 or less</td>
                  <td className="px-6 py-4 text-center text-green-400">Yes</td>
                  <td className="px-6 py-4 text-center text-green-400">Free (metadata only)</td>
                  <td className="px-6 py-4 text-center text-red-400">Expensive</td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Survives metadata strip</td>
                  <td className="px-6 py-4 text-center text-green-400">Yes (watermark + hash)</td>
                  <td className="px-6 py-4 text-center text-red-400">No</td>
                  <td className="px-6 py-4 text-center text-yellow-400">Sometimes</td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Privacy (no raw files)</td>
                  <td className="px-6 py-4 text-center text-green-400">100 %</td>
                  <td className="px-6 py-4 text-center text-green-400">100 %</td>
                  <td className="px-6 py-4 text-center text-yellow-400">Varies</td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium">Anyone can verify</td>
                  <td className="px-6 py-4 text-center text-green-400">Drag & drop</td>
                  <td className="px-6 py-4 text-center text-yellow-400">Needs special tools</td>
                  <td className="px-6 py-4 text-center text-red-400">Needs their app</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Donation Section */}
      <section className="mt-16 w-full max-w-md mx-auto">
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-yellow-100">This demo is 100 % gasless</h3>
            <p className="text-yellow-200 mb-6">I pay the ~$0.001 per image with my own wallet</p>
            <div className="space-y-4">
              <div>
                <p className="font-mono text-sm bg-black/20 px-4 py-2 rounded inline-block text-yellow-100">
                  0x97D240c4E2aad5601402726d676ee3Fe2E97EfA6
                </p>
                <p className="text-sm text-yellow-200 mt-1">Send any Base ETH (appreciated!)</p>
              </div>
              <a href="https://buymeacoffee.com/tamtunnel" target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 text-lg">
                  Buy me a coffee ☕
                </Button>
              </a>
            </div>
            <p className="text-sm text-yellow-200 mt-4">
              Every $5 = ~5,000 free registrations for the community ♥
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>
          Made with ❤️ by <a href="https://github.com/TamTunnel" className="underline hover:text-blue-400">TamTunnel</a> • 
          Main repo: <a href="https://github.com/TamTunnel/PoG" className="underline hover:text-blue-400">github.com/TamTunnel/PoG</a>
        </p>
        <p className="mt-2">Open source • Privacy-first • December 2025</p>
      </footer>
    </main>
  );
}
