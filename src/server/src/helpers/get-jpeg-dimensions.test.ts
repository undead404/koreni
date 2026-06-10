import { describe, expect,it } from 'vitest';

import { getJpegDimensions } from './get-jpeg-dimensions.js';

describe('getJpegDimensions', () => {
  it('correctly parses width and height from valid JPEG buffer', () => {
    const buffer = Buffer.from([
      0xFF, 0xD8, // SOI
      0xFF, 0xE0, // APP0
      0x00, 0x10, // Length (16)
      0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, // JFIF data
      0xFF, 0xC0, // SOF0
      0x00, 0x0B, // Length (11)
      0x08,       // Precision
      0x01, 0x2C, // Height (300)
      0x02, 0x58, // Width (600)
      0x03,       // Components
      0x01, 0x11, 0x00,
    ]);

    const dimensions = getJpegDimensions(buffer);
    expect(dimensions).toEqual({ width: 600, height: 300 });
  });

  it('throws an error for non-JPEG buffer', () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02]);
    expect(() => getJpegDimensions(buffer)).toThrow('Not a valid JPEG file');
  });

  it('throws an error if no SOF marker is found', () => {
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]);
    expect(() => getJpegDimensions(buffer)).toThrow('Could not find SOF marker in JPEG');
  });
});
