import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { ethers } from 'ethers';
import { WaterMarkEncoder } from 'invisible-watermark';

// Your project wallet (public receive only)
const RECEIVE_WALLET = '0x97D240c4E2aad5601402726d676ee3Fe2E97EfA6';

// Private key for gas payment (set as secret in Cloudflare dashboard)
const PRIVATE_KEY = env.PRIVATE_KEY; // Add this in Wrangler secrets

const app = new Hono();

// ABI for your contract
const CONTRACT_ABI = [/* your register ABI from earlier */];
const CONTRACT_ADDRESS = '0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new ethers.Wallet(PRIVATE_KEY, provider));

app.post('/api/register', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  if (!file) return c.json({ error: 'No file' }, 400);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Watermark it
  const encoder = new WaterMarkEncoder();
  encoder.set_watermark('bytes', b'AI2025');
  const watermarkedBuffer = encoder.embed_buffer(buffer, 'AI2025'); // Pseudo - use actual method

  // Compute hashes (simplified)
  const contentHash = ethers.keccak256(watermarkedBuffer);
  const perceptualHash = ethers.keccak256('0x' + 'dummyphash'); // Add pHash logic

  // Build tx
  const tx = await contract.register(contentHash, perceptualHash, 'DemoTool', 'Demo:Flux', ethers.keccak256('demo params'), '0x0000...', '0x0000...');
  const receipt = await tx.wait();

  return c.json({ txHash: receipt.hash, explorer: `https://basescan.org/tx/${receipt.hash}` });
});

app.post('/api/verify', async (c) => {
  // Client-side for demo, but server for heavy compute
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  if (!file) return c.json({ error: 'No file' }, 400);

  // Mock verification (add real logic)
  return c.json({
    signal: 'Strong: Watermarked AI + attested PoG',
    watermark_detected: true,
    pog_events_found: 1,
    txHash: '0x123...',
    warning: 'Proves claims, not truth. Bad actors can evade.'
  });
});

export default app;
