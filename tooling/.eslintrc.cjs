module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', '.npm-cache/'],
  extends: ['airbnb-base', 'plugin:svelte/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es2022: true,
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: null,
      },
      rules: {
        'import/no-mutable-exports': 'off',
        'import/prefer-default-export': 'off',
      },
    },
    {
      files: ['tooling/tests/**/*.js', 'tooling/*.config.js'],
      env: {
        node: true,
      },
    },
  ],
  settings: {
    'import/core-modules': [
      '@sveltejs/vite-plugin-svelte',
      '@tailwindcss/vite',
      'svelte/transition',
      'vitest/config',
    ],
    'import/resolver': {
      node: {
        extensions: ['.js', '.svelte'],
      },
    },
  },
  rules: {
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
        svelte: 'always',
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['tooling/*.config.js', 'tooling/tests/**/*.js'],
      },
    ],
  },
};
