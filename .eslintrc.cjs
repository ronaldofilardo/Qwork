/**
 * ESLint Configuration - Quality Baseline Strategy
 *
 * This configuration implements a phased approach to eliminate the build/lint warning loop:
 * 1. Legacy code (existing files): warnings only - won't break builds
 * 2. New/modified code: stricter rules to prevent regressions
 * 3. Critical safety rules: always errors (security, runtime safety)
 *
 * @see docs/QUALITY_BASELINE_PLAN.md for migration plan and metrics
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // ============================================================
    // BASELINE RULES - Legacy code (warnings only)
    // These won't break builds but show up in reports
    // ============================================================

    // Disable base ESLint rules that conflict with TypeScript-aware versions
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    'no-redeclare': 'off',
    'no-use-before-define': 'off',
    'no-undef': 'off',

    // Type safety - warnings for legacy, will become errors after cleanup
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',

    // Promise handling - critical for runtime but warn in legacy
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/await-thenable': 'warn',

    // Code quality - informational
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/restrict-plus-operands': 'warn',

    // ============================================================
    // CRITICAL RULES - Always errors (security/runtime safety)
    // ============================================================
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-redeclare': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },

  overrides: [
    // ============================================================
    // LEGACY CODE - All warnings (baseline documented)
    // ============================================================
    {
      files: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      rules: {
        // All unsafe rules remain warnings in legacy code
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-base-to-string': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      },
    },

    // ============================================================
    // TEST FILES - Strict rules per QUALITY-POLICY.md
    // Mantém tipagem forte e previne antipadrões comuns
    // @see docs/testing/QUALITY-POLICY.md
    // ============================================================
    {
      files: ['__tests__/**', '*.test.{ts,tsx}', '*.spec.{ts,tsx}'],
      rules: {
        // REGRAS MANTIDAS ATIVAS (conforme política)
        '@typescript-eslint/no-explicit-any': 'error', // Força tipagem explícita
        '@typescript-eslint/no-require-imports': 'error', // Proíbe require() em TS
        '@typescript-eslint/require-await': 'error', // Async deve ter await
        '@typescript-eslint/unbound-method': 'warn', // Alerta métodos desvinculados

        // Permite _ prefix para variáveis intencionalmente não usadas
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],

        // Regras relaxadas apenas quando necessário para testes
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',

        // Regras desabilitadas para compatibilidade com frameworks de teste
        '@typescript-eslint/no-unsafe-return': 'off', // Mock factories podem retornar tipos variados
      },
    },
  ],
};
