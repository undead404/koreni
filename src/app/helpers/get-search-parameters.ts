export default function getSearchParameters(): URLSearchParams {
  // search is empty during build
  return new URLSearchParams(globalThis.location?.search || '');
}
