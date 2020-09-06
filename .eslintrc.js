module.exports = {
  extends: ['airbnb-base', 'plugin:promise/recommended'],
  plugins: ['import', 'node'],
  rules: {
    'max-len': ['error', 150, 2],
  },
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },
  globals: {
    jest: false,
    describe: false,
    it: false,
    expect: false,
  },
};
