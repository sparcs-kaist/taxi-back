module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "prettier", "mocha"],
  parserOptions: {
    ecmaVersion: 13,
  },
  rules: {
    "no-unused-vars": 1,
  },
};
