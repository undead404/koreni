export default function getCurrentDate() {
  return new Date().toISOString().split('T', 1)[0];
}
