import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.resolve(__dirname, "../assets/logo-bg.png");
const OUTPUT_DIR = path.resolve(__dirname, "../public/icons");
const PUBLIC_DIR = path.resolve(__dirname, "../public");

const ICONS = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "icon-maskable-192x192.png", size: 192, maskable: true },
  { name: "icon-maskable-512x512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, toPublicRoot: true },
];

async function generateIcons() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const icon of ICONS) {
    const outputPath = icon.toPublicRoot
      ? path.resolve(PUBLIC_DIR, icon.name)
      : path.resolve(OUTPUT_DIR, icon.name);

    if (icon.maskable) {
      const padding = Math.round(icon.size * 0.1);
      const innerSize = icon.size - padding * 2;

      await sharp(SOURCE)
        .resize(innerSize, innerSize, {
          fit: "contain",
          background: { r: 234, g: 29, b: 44, alpha: 1 },
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 234, g: 29, b: 44, alpha: 1 },
        })
        .png()
        .toFile(outputPath);
    } else {
      await sharp(SOURCE)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
    }

    console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
  }

  console.log("All icons generated successfully!");
}

generateIcons().catch(console.error);
