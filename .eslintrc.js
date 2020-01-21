module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es6: true
  },
  globals: {
    chrome: true
  },
  extends: ['eslint:recommended']
}
