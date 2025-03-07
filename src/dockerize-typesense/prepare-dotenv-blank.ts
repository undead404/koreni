import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { TYPESENSE_PORT } from './config';
import writeEnvironmentValues from './write-environment-values';

// Define the file paths
const environmentExamplePath = path.resolve('.', '.env.example');
const environmentPath = path.resolve('.', '.env');

export default function prepareDotenvBlank() {
  // Check if .env file exists
  if (existsSync(environmentPath)) {
    console.log('.env file already exists');
  } else {
    // If .env doesn't exist, copy .env.example to .env
    copyFileSync(environmentExamplePath, environmentPath);
    console.log('.env file created from .env.example');
    writeEnvironmentValues({
      NEXT_PUBLIC_TYPESENSE_HOST: 'http://localhost:' + TYPESENSE_PORT,
    });
  }
}
