export function getJpegDimensions(buffer: Buffer): {
  width: number;
  height: number;
} {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('Not a valid JPEG file');
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) {
      offset++;
    }

    if (offset >= buffer.length) {
      break;
    }

    while (offset < buffer.length && buffer[offset] === 0xff) {
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

    if (offset + 2 > buffer.length) {
      break;
    }
    const isSOF =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
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
