import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubmitTab from "./submit/page";
import VerifyTab from "./verify/page";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            PoG v2 – Gasless Demo
          </h1>
          <p className="text-xl text-muted-foreground">
            Fully open-source • Privacy-first • Blockchain-based AI provenance registry
          </p>
          <p className="mt-4 text-lg">
            Drop an AI image → we invisibly watermark + register it on Base <strong>completely free</strong>
          </p>
        </div>

        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="submit">Submit & Register (Free)</TabsTrigger>
            <TabsTrigger value="verify">Verify Any Image</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <SubmitTab />
          </TabsContent>
          <TabsContent value="verify">
            <VerifyTab />
          </TabsContent>
        </Tabs>

        <div className="mt-16 border-t pt-10">
          <h2 className="text-3xl font-bold text-center mb-8">Advantages vs Everything Else</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3 text-center bg-card">PoG v2 (us)</th>
                  <th className="px-4 py-3 text-center bg-muted">C2PA (Adobe etc.)</th>
                  <th className="px-4 py-3 text-center bg-muted">Closed commercial tools</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr><td className="px-4 py-3 font-medium">Open source</td><td className="px-4 py-3 text-center bg-card">Yes</td><td className="px-4 py-3 text-center">Partially</td><td className="px-4 py-3 text-center">No</td></tr>
                <tr className="bg-muted/30"><td className="px-4 py-3 font-medium">Works today</td><td className="px-4 py-3 text-center bg-card">Yes</td><td className="px-4 py-3 text-center">Mostly future</td><td className="px-4 py-3 text-center">Yes (paid)</td></tr>
                <tr><td className="px-4 py-3 font-medium">Costs ~$0.001 or less</td><td className="px-4 py-3 text-center bg-card">Yes</td><td className="px-4 py-3 text-center">Free (metadata only)</td><td className="px-4 py-3 text-center">Expensive</td></tr>
                <tr className="bg-muted/30"><td className="px-4 py-3 font-medium">Survives metadata strip</td><td className="px-4 py-3 text-center bg-card">Yes (watermark + hash)</td><td className="px-4 py-3 text-center">No</td><td className="px-4 py-3 text-center">Sometimes</td></tr>
                <tr><td className="px-4 py-3 font-medium">Privacy (no raw files)</td><td className="px-4 py-3 text-center bg-card">100 %</td><td className="px-4 py-3 text-center">100 %</td><td className="px-4 py-3 text-center">Varies</td></tr>
                <tr className="bg-muted/30"><td className="px-4 py-3 font-medium">Anyone can verify</td><td className="px-4 py-3 text-center bg-card">Drag & drop</td><td className="px-4 py-3 text-center">Needs special tools</td><td className="px-4 py-3 text-center">Needs their app</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 p-8 rounded-lg border bg-card text-card-foreground">
            <h3 className="text-2xl font-bold mb-4 text-center">This demo is 100 % gasless – I pay the gas</h3>
            <p className="text-center mb-6">
              Want to help keep it free forever and fund the permanent public relayer?
            </p>
            <div className="text-center space-y-4">
              <div>
                <p className="font-mono text-sm bg-muted px-4 py-2 rounded inline-block">
                  0x97D240c4E2aad5601402726d676ee3Fe2E97EfA6
                </p>
                <p className="text-sm text-muted-foreground mt-2">Base ETH → any amount appreciated</p>
              </div>
              <div className="text-3xl">or</div>
              <a href="https://buymeacoffee.com/tamtunnel" target="_blank" className="inline-block">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg">
                  Buy me a coffee ☕
                </button>
              </a>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Every $5 = ~5,000 free registrations for the community ♥
            </p>
          </div>

          <div className="text-center mt-12 text-sm text-muted-foreground">
            <p>
              Made with love by <a href="https://github.com/TamTunnel" className="underline">TamTunnel</a> • 
              Main repo: <a href="https://github.com/TamTunnel/PoG" className="underline">github.com/TamTunnel/PoG</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
