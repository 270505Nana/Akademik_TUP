import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compressImageBuffer } from "../src/services/storageService.js";

describe("Storage service image compression", () => {
  it("compresses supported images only when the result is smaller", async () => {
    const source = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 120, g: 80, b: 40 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const compressed = await compressImageBuffer(source, "image/jpeg");

    expect(compressed.length).toBeLessThan(source.length);
    await expect(sharp(compressed).metadata()).resolves.toMatchObject({
      format: "jpeg",
      width: 1200,
      height: 800,
    });
  });

  it("passes non-image files through unchanged", async () => {
    const source = Buffer.from("plain text file");

    await expect(
      compressImageBuffer(source, "text/plain")
    ).resolves.toBe(source);
  });

  it("falls back to the original buffer when image processing fails", async () => {
    const source = Buffer.from("not an image");

    await expect(
      compressImageBuffer(source, "image/jpeg")
    ).resolves.toBe(source);
  });
});
