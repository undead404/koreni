import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, 'schema.sql');
const databasePath = path.join(process.cwd(), 'local.db');

console.log(`Initializing database at ${databasePath}...`);

try {
  const schema = fs
    .readFileSync(schemaPath, 'utf8')
    .split('\n')
    // Remove comments
    .filter(
      (line) => !line.trim().startsWith('#') && !line.trim().startsWith('--'),
    )
    .join('\n')
    // SQLite requires function calls in DEFAULT to be enclosed in parentheses
    // e.g., DEFAULT unixepoch() -> DEFAULT (unixepoch())
    .replaceAll(/DEFAULT\s+unixepoch\(\)/gi, 'DEFAULT (unixepoch())');

  const database = new Database(databasePath);

  database.exec(schema);

  console.log('Database initialized successfully.');
  database.close();
} catch (error: unknown) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
