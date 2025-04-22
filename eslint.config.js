import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FlatCompat } from '@eslint/eslintrc';
import jsPkg from '@eslint/js';
const { configs: jsConfigs } = jsPkg;

import globalsPkg from 'globals';
const { browser, node, es6, jest } = globalsPkg;

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: jsConfigs.recommended,
});

export default [
    ...compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
    ),

    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        ignores: ['/docker', '/coverage', '/.idea', 'package.json', 'yarn.lock'],

        languageOptions: {
            globals: {
                ...browser,
                ...node,
                ...es6,
                ...jest,
            },

            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
        },

        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
            prettier: prettierPlugin,
        },

        settings: { react: { version: 'detect' } },

        rules: {
            'linebreak-style': ['error', 'unix'],
            quotes: 0,
            semi: ['error', 'always'],
            'prettier/prettier': 0,
            'no-shadow': 0,
            'no-restricted-globals': 0,
            'import/prefer-default-export': 0,
            camelcase: 1,
            'no-unused-vars': 0,
            'import/order': 0,
            'no-await-in-loop': 1,
            'no-use-before-define': 1,
            'no-restricted-syntax': 1,
            'import/extensions': 0,
            'class-methods-use-this': 1,
            'global-require': 0,
            'prefer-promise-reject-errors': 1,
            'no-useless-concat': 0,
            eqeqeq: 0,
            'no-plusplus': 0,
            'prefer-const': 1,
            'no-param-reassign': 1,
            'consistent-return': 1,
            'no-return-await': 0,
            'default-case': 1,
            'array-callback-return': 0,
            'no-case-declarations': 0,
            'no-prototype-builtins': 0,
        },
    },
];
