import fs from 'node:fs/promises';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportPayload } from '@/shared/schemas/import';

import { handleImport } from './handle-import';

// Мокаємо файлову систему, щоб не писати на диск
vi.mock('node:fs/promises');

describe('Import Data Script', () => {
  // Тестові дані
  const validPayload: ImportPayload = {
    date: new Date('2026-01-01'),
    id: '1897-kyiv-city',
    title: 'Тестова метрика 1897',
    yearsRange: [1897],
    location: [50.45, 30.52],
    author: 'Test User <test@example.com>',
    archiveItems: ['ДАКО-123-1-1'],
    sources: ['https://example.com/source'],
    records: [
      { Прізвище: 'Іваненко', "Ім'я": 'Іван', Вік: 25 },
      { Прізвище: 'Петренко', "Ім'я": 'Марія', Вік: 20 },
    ],
    tableLocale: 'uk',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('повинен успішно створити CSV та YAML файли для валідних даних', async () => {
    // Викликаємо функцію
    const result = await handleImport(validPayload, '/mock/root');

    // 1. Перевіряємо, що згенерувались правильні імена
    expect(result.slugId).toBe('1897-kyiv-city');
    expect(result.csvFilename).toBe('1897-kyiv-city.csv');

    // 2. Перевіряємо, чи викликався mkdir (створення папок)
    expect(fs.mkdir).toHaveBeenCalledTimes(2);
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join('/mock/root', 'data', 'tables'),
      { recursive: true },
    );

    // 3. Перевіряємо, чи викликався writeFile (запис файлів)
    expect(fs.writeFile).toHaveBeenCalledTimes(2);

    // Перевіряємо контент CSV (перший виклик writeFile)
    const csvCall = vi.mocked(fs.writeFile).mock.calls[0];
    expect(csvCall[0]).toContain('1897-kyiv-city.csv');
    expect(csvCall[1]).toContain('"Іваненко","Іван","25"'); // PapaParse output

    // Перевіряємо контент YAML (другий виклик writeFile)
    const yamlCall = vi.mocked(fs.writeFile).mock.calls[1];
    expect(yamlCall[0]).toContain('1897-kyiv-city.yml');
    expect(yamlCall[1]).toContain('id: 1897-kyiv-city');
    expect(yamlCall[1]).toContain('author: Test User <test@example.com>');
    expect(yamlCall[1]).toContain('size: 2');
  });

  it('повинен кидати помилку для невалідних даних', async () => {
    const invalidPayload = {
      ...validPayload,
      date: 'invalid-date',
    };

    await expect(handleImport(invalidPayload, '/mock/root')).rejects.toThrow(
      /Invalid date format/,
    );
    // Перевіряємо, що файли не створюються при помилці
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
