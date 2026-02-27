export default function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}
