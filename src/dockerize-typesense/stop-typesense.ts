import { execSync } from 'node:child_process';

export default function stopTypesense() {
  execSync('docker stop typesense-server');
}
