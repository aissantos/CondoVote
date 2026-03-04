// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';

export default [{
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: { parser: tsParser },
  plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks, 'jsx-a11y': a11y },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',          // any = erro de CI
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/rules-of-hooks': 'error',                  // Rules of Hooks
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/interactive-supports-focus': 'warn',
    'no-console': ['error', { allow: ['warn', 'error'] }],  // sem console.log no source
  }
}, ...storybook.configs["flat/recommended"]];
