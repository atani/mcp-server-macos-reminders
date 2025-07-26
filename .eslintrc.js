module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.eslint.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
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
  overrides: [
    {
      // Test files can be more lenient
      files: ['**/*.test.ts', '**/tests/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.d.ts',
  ],
};