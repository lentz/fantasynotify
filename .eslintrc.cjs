module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:import/recommended',
    'plugin:vitest/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'vitest'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    'import/no-unresolved': 'off',
    'no-console': 'off',
    'no-param-reassign': 'off',
  },
};
