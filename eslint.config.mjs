import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import vitest from '@vitest/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import pluginPromise from 'eslint-plugin-promise';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as regexpPlugin from 'eslint-plugin-regexp';
import pluginSecurity from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      parserOptions: {
        // There is a major issue with TS + ESLint + Monorepo
        // And we faced it as well https://github.com/typescript-eslint/typescript-eslint/issues/1192
        // However, using this "projectService" resolved it for us
        // More details on "projectService": https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta#project-service
        projectService: true,
        project: ['./tsconfig.json'],
      },
    },
  },
  includeIgnoreFile(gitignorePath),
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked.map((config) => ({
    files: ['**/*.{ts,tsx}'],
    ...config,
  })),
  pluginPromise.configs['flat/recommended'],
  eslintPluginUnicorn.configs['flat/recommended'],
  regexpPlugin.configs['flat/recommended'],
  {
    name: 'Custom rules for all the code',
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Due to a bug: https://github.com/eslint/eslint/issues/19134
      // '@typescript-eslint/no-unused-expressions': 'off',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Node.js builtins.
            [
              `^(${builtinModules.map((moduleName) => `node:${moduleName}`).join('|')})(/|$)`,
            ],
            // libs.
            [String.raw`^@?(\w|.)[^./]`],
            // Internal libs.
            [String.raw`^@\/(\w|.)[^./]`],
            // Same scope imports
            [
              String.raw`^@\/(\w|.)[^./]`, // Root-alias imports
              String.raw`^\.\.(?!/?$)`, // Parent imports. Put `..` last.
              String.raw`^\.\./?$`,
            ],
            // Other relative imports. Put same-folder imports and `.` last.
            [
              String.raw`^\./(?=.*/)(?!/?$)`,
              String.raw`^\.(?!/?$)`,
              String.raw`^\./?$`,
            ],
            // Style imports.
            [String.raw`^.+\.s?css$`],
            // Image imports.
            [String.raw`^.+\.svg|png|jpg$`],
          ],
        },
      ],
      // 'unicorn/expiring-todo-comments': 'off',
      // 'unicorn/prefer-top-level-await': 'off',
      'no-console': 'warn',
      'unicorn/no-null': 'off',
      // 'unicorn/no-array-reduce': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            generateStaticParams: true,
          },
        },
      ],
    },
  },
  {
    files: [
      'src/populate-typesense/**/*.{js,mjs,cjs,ts}',
      'src/shared/**/*.{js,mjs,cjs,ts}',
      'next.config.ts',
      'vitest.config.ts',
      'vitest.setup.ts',
    ],
    ...pluginSecurity.configs.recommended,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        // There is a major issue with TS + ESLint + Monorepo
        // And we faced it as well https://github.com/typescript-eslint/typescript-eslint/issues/1192
        // However, using this "projectService" resolved it for us
        // More details on "projectService": https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta#project-service
        projectService: true,
        project: ['./tsconfig.json'],
      },
    },
    name: 'NodeJS only',
    rules: {
      // '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['*.{jsx,tsx}'],
    name: 'NextJS + React code',
    ...pluginReact.configs.flat.recommended,
    ...pluginReact.configs.flat['jsx-runtime'],
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // There is a major issue with TS + ESLint + Monorepo
        // And we faced it as well https://github.com/typescript-eslint/typescript-eslint/issues/1192
        // However, using this "projectService" resolved it for us
        // More details on "projectService": https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta#project-service
        projectService: true,
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      ...pluginReact.configs.flat.recommended.plugins,
      ...pluginReact.configs.flat['jsx-runtime'].plugins,
      ...jsxA11y.flatConfigs.recommended.plugins,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReact.configs.flat['jsx-runtime'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            generateStaticParams: true,
          },
        },
      ],
    },
    settings: {
      'jsx-a11y': {
        attributes: {
          for: ['htmlFor', 'for'],
        },
      },
      next: {
        rootDir: `.`,
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // There is a major issue with TS + ESLint + Monorepo
        // And we faced it as well https://github.com/typescript-eslint/typescript-eslint/issues/1192
        // However, using this "projectService" resolved it for us
        // More details on "projectService": https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta#project-service
        projectService: true,
        project: ['./tsconfig.json'],
      },
    },
    name: 'Tests only',
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-img-element': 'off',
      'jsx-a11y/heading-has-content': 'off',
    },
  },
  {
    files: ['src/populate-typesense/**/*.ts'],
    rules: {
      'no-console': 'off',
      'unicorn/no-process-exit': 'off',
    },
  },
  eslintConfigPrettier, // align prettier rules with eslint rules
];
