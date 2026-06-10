export function getJpegDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    throw new Error('Not a valid JPEG file');
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xFF) {
      offset++;
    }

    if (offset >= buffer.length) {
      break;
    }

    while (offset < buffer.length && buffer[offset] === 0xFF) {
      offset++;
    }

    if (offset >= buffer.length) {
      break;
    }

    const marker = buffer[offset];
    offset++;

    if (marker === 0x00) {
      continue;
    }

    const isSOF = (marker >= 0xC0 && marker <= 0xCF) &&
                  marker !== 0xC4 &&
                  marker !== 0xC8 &&
                  marker !== 0xCC;

    if (offset + 2 > buffer.length) {
      break;
    }
    const length = buffer.readUInt16BE(offset);

    if (isSOF) {
      if (offset + 7 > buffer.length) {
        throw new Error('Invalid SOF segment');
      }
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { width, height };
    }

    offset += length;
  }

  throw new Error('Could not find SOF marker in JPEG');
}
