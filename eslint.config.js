const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // General ESLint rules
      'no-console': 'off', // Allow console.log for MCP server
      'no-unused-vars': 'off', // Handled by TypeScript
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',
      'no-useless-catch': 'off', // Allow re-throwing for error handling
    },
  },
  {
    // Test files can be more lenient
    files: ['**/*.test.ts', '**/tests/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Ignore patterns
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.js',
      '**/*.d.ts',
    ],
  },
];