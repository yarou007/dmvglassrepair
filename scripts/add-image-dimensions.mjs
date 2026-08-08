import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entries = await readdir(root, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .filter((name) => name !== "google10f3f95e19031958.html");
const dimensions = new Map();

const jpegDimensions = (buffer) => {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (startOfFrame.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += length + 2;
  }
  return null;
};

const webpDimensions = (buffer) => {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + ((b1 & 0xc0) >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
};

const readDimensions = (buffer) => {
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 12 && buffer.readUInt16BE(0) === 0xffd8) return jpegDimensions(buffer);
  if (buffer.length >= 30 && buffer.toString("ascii", 8, 12) === "WEBP") return webpDimensions(buffer);
  return null;
};

const getDimensions = async (source) => {
  if (/^(?:https?:|data:|\/\/)/i.test(source)) return null;
  const cleanSource = source.split(/[?#]/, 1)[0];
  if (/(?:^|\/)(?:\.\.|%2e%2e)(?:\/|$)/i.test(cleanSource)) return null;
  const imagePath = resolve(root, cleanSource.replace(/^\/+/, ""));
  const fromRoot = relative(root, imagePath);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) return null;
  if (dimensions.has(imagePath)) return dimensions.get(imagePath);
  try {
    const value = readDimensions(await readFile(imagePath));
    dimensions.set(imagePath, value);
    return value;
  } catch {
    dimensions.set(imagePath, null);
    return null;
  }
};

let changedCount = 0;
for (const file of htmlFiles) {
  const path = resolve(root, file);
  const original = await readFile(path, "utf8");
  const matches = [...original.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)];
  let html = original;

  for (const match of matches.reverse()) {
    const [tag, source] = match;
    const size = await getDimensions(source);
    if (!size) continue;
    const loading = /\bloading=["']/i.test(tag)
      ? ""
      : ` loading="${/\bfetchpriority=["']high["']/i.test(tag) ? "eager" : "lazy"}`;
    const decoding = /\bdecoding=["']/i.test(tag) ? "" : ' decoding="async"';
    const normalizedTag = tag
      .replace(/\s+width="[^"]*"/gi, "")
      .replace(/\s+height="[^"]*"/gi, "")
      .replace(
        /\s*\/>$/,
        `${loading}${decoding} height="${size.height}" width="${size.width}"/>`
      )
      .replace(
        /(?<!\/)\>$/,
        `${loading}${decoding} height="${size.height}" width="${size.width}">`
      );
    html = `${html.slice(0, match.index)}${normalizedTag}${html.slice(match.index + tag.length)}`;
  }

  if (html !== original) {
    await writeFile(path, html);
    changedCount += 1;
  }
}

console.log(`Updated intrinsic image dimensions in ${changedCount} HTML files.`);
