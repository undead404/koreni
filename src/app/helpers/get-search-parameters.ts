export default function getSearchParameters() {
  // search is empty during build
  return new URLSearchParams(globalThis.location?.search || '');
}
