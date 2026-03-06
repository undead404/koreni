import fs from 'node:fs';

import yaml from 'yaml';

import { indexationTableSchema } from './schema/indexation-table.js';
import environment from './environment.js';

const filesListPath = '../../added_files.txt';

if (!fs.existsSync(filesListPath)) {
  console.error('Файл доданих файлів не знайдено');
  process.exit(1);
}

const addedFiles = fs
  .readFileSync(filesListPath, 'utf8')
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean);

if (addedFiles.length === 0) {
  process.exit(0);
}

let count = 0;
const blocks = [];

for (const file of addedFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = yaml.parse(content) as unknown;

    const tableMetadata = indexationTableSchema.parse(data);
    const title = tableMetadata.title;

    // Форматування років (один рік або діапазон)
    const years =
      tableMetadata.yearsRange?.length > 1
        ? `${tableMetadata.yearsRange[0]}–${tableMetadata.yearsRange[1]}`
        : tableMetadata.yearsRange?.[0] || 'Роки не вказані';

    // Форматування архівів (з обрізанням довгого списку)
    let archives = 'Не вказано';
    if (tableMetadata.archiveItems && tableMetadata.archiveItems.length > 0) {
      const limit = 3;
      const shown = tableMetadata.archiveItems.slice(0, limit).join(', ');
      const hiddenCount = tableMetadata.archiveItems.length - limit;
      archives = hiddenCount > 0 ? `${shown} та ще ${hiddenCount}` : shown;
    }

    let block = `🗂 <b>${title}</b>\n`;
    block += `📅 ${years} | 📊 ${tableMetadata.size || 0} записів\n`;
    block += `🏛 ${archives}\n`;

    if (tableMetadata.authorName) {
      block += `👤 ${tableMetadata.authorName}\n`;
    }

    // Припущення: URL будується на основі id
    if (tableMetadata.id) {
      block += `🔗 <a href="https://koreni.org.ua/${tableMetadata.id}">Переглянути таблицю</a>\n`;
    }

    blocks.push(block);
    count++;
  } catch (error) {
    console.error(`Помилка читання ${file}:`, error);
  }
}

if (count === 0) {
  process.exit(0);
}

const header = `<b>Нові надходження до бази (${count}):</b>\n\n`;
const finalMessage = header + blocks.join('\n');

const response = await fetch(
  `https://api.telegram.org/bot${environment.TELEGRAM_BOT_TOKEN}/sendMessage`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: environment.TELEGRAM_CHAT_ID,
      text: finalMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  },
);

if (!response.ok) {
  const error = await response.text();
  console.error('Помилка Telegram API:', error);
  process.exit(1);
}
