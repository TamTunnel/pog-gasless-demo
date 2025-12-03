const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { ethers } = require("ethers");
const { keccak256, toHex } = require("viem");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const PRIVATE_KEY = process.env.PRIVATE_KEY; // better: read from env
const CONTRACT_ADDRESS = "0xf0D814C2Ff842C695fCd6814Fa8776bEf70814F3";
const ABI = [
  // TODO: paste your real `register` ABI here
];

const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

app.post("/api/register", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });

    // Server-side watermark with Jimp
    const image = await Jimp.read(file.path);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    image.print(font, 10, 10, "AI2025");
    await image.writeAsync(file.path);

    // Compute content hash (keccak256 of file bytes)
    const data = fs.readFileSync(file.path);
    const contentHash = keccak256(new Uint8Array(data)); // returns 0x...

    // Dummy perceptual hash and params hash for demo
    const perceptualHash = keccak256(
      new Uint8Array(Buffer.from("dummyphash"))
    );
    const paramsHash = keccak256(new Uint8Array(Buffer.from("demo")));

    const tool = "Demo";
    const model = "Demo:Flux";
    const creator = "0x0000000000000000000000000000000000000000";
    const recipient = "0x0000000000000000000000000000000000000000";

    const tx = await contract.register(
      contentHash,
      perceptualHash,
      tool,
      model,
      paramsHash,
      creator,
      recipient
    );
    const receipt = await tx.wait();

    fs.unlinkSync(file.path); // Clean up temp file

    res.json({
      txHash: receipt.hash,
      explorer: `https://basescan.org/tx/${receipt.hash}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
});

app.listen(3001, () => console.log("Server on 3001"));
