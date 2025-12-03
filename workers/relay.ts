import { Hono } from "hono"
import { serveStatic } from "hono/cloudflare-workers"
import { ethers } from "ethers"
import WaterMarkEncoder from "invisible-watermark"

// Cloudflare Worker env typings
type Env = {
  Bindings: {
    PRIVATE_KEY: string
  }
}

// Your project wallet (public receive only)
const RECEIVE_WALLET = "0x97D240c4E2aad5601402726d676ee3Fe2E97EfA6"

const app = new Hono<Env>()

// ABI for your contract
const CONTRACT_ABI: any[] = [
  // TODO: paste your real `register` ABI items here
]
const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3"
const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")

app.post("/api/register", async (c) => {
  const privateKey = c.env.PRIVATE_KEY
  const wallet = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet)

  const formData = await c.req.formData()
  const file = formData.get("file") as File | null
  if (!file) return c.json({ error: "No file" }, 400)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Watermark it (placeholder – replace with real invisible-watermark usage)
  const encoder = new WaterMarkEncoder()
  // @ts-expect-error: library typings may not expose this exactly; adjust to real API
  const watermarkedBuffer = encoder.encode(buffer, "AI2025")

  const contentHash = ethers.keccak256(watermarkedBuffer)
  const perceptualHash = ethers.keccak256(ethers.toUtf8Bytes("dummyphash"))

  const tool = "DemoTool"
  const model = "Demo:Flux"
  const paramsHash = ethers.keccak256(ethers.toUtf8Bytes("demo params"))
  const creator = "0x0000000000000000000000000000000000000000"
  const recipient = RECEIVE_WALLET

  const tx = await contract.register(
    contentHash,
    perceptualHash,
    tool,
    model,
    paramsHash,
    creator,
    recipient
  )
  const receipt = await tx.wait()

  return c.json({
    txHash: receipt.hash,
    explorer: `https://basescan.org/tx/${receipt.hash}`,
  })
})

app.post("/api/verify", async (c) => {
  const formData = await c.req.formData()
  const file = formData.get("file") as File | null
  if (!file) return c.json({ error: "No file" }, 400)

  return c.json({
    signal: "Strong: Watermarked AI + attested PoG",
    watermark_detected: true,
    pog_events_found: 1,
    txHash: "0x123...",
    warning: "Proves claims, not truth. Bad actors can evade.",
  })
})

export default app

