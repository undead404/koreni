export default function serializeJsonLd(
  value: unknown,
  indentation?: number,
): string {
  return JSON.stringify(value, null, indentation).replaceAll(
    '<',
    String.raw`\u003c`,
  );
}
