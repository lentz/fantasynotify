module.exports = {
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'prettier',
  ],
  plugins: ['jest'],
  rules: {
    'jest/expect-expect': 'error',
    'no-console': 'off',
    'no-param-reassign': 'off',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_*',
      },
    ],
  },
};
