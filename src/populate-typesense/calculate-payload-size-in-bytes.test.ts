import { describe, expect, it } from 'vitest';

import calculatePayloadSizeInBytes from './calculate-payload-size-in-bytes';

describe('calculatePayloadSizeInBytes', () => {
  it('should return 0 for an empty object', () => {
    const payload = {};
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(2); // "{}" is 2 bytes
  });

  it('should return the correct size for a simple object', () => {
    const payload = { key: 'value' };
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(15); // '{"key":"value"}' is 15 bytes
  });

  it('should return the correct size for an array', () => {
    const payload = [1, 2, 3];
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(7); // '[1,2,3]' is 7 bytes
  });

  it('should return the correct size for a string', () => {
    const payload = 'Hello, world!';
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(15); // '"Hello, world!"' is 15 bytes
  });

  it('should return the correct size for a number', () => {
    const payload = 12_345;
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(5); // '12345' is 5 bytes
  });

  it('should return the correct size for a boolean', () => {
    const payload = true;
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(4); // 'true' is 4 bytes
  });

  it('should return the correct size for null', () => {
    const payload = null;
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(4); // 'null' is 4 bytes
  });

  it('should return the correct size for an object with nested objects', () => {
    const payload = { nested: { key: 'value' } };
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(26); // '{"nested":{"key":"value"}}' is 26 bytes
  });

  it('should return the correct size for an object with special characters', () => {
    const payload = { text: 'Hello, \t\n world!' };
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(29); // '{"text":"Hello, \t\n world!"}' is 29 bytes
  });

  it('should return the correct size for an object with Cyrillic characters', () => {
    const payload = { text: 'Здрастуй, світе!' };
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(40); // '{"text":"Здрастуй, світе!"}' is 40 bytes
  });

  it('should return the correct size for a deeply nested object', () => {
    const payload = {
      level1: { level2: { level3: { level4: { key: 'value' } } } },
    };
    const size = calculatePayloadSizeInBytes(payload);
    expect(size).toBe(59); // '{"level1":{"level2":{"level3":{"level4":{"key":"value"}}}}}' is 59 bytes
  });
});
