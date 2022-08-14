module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "prettier", "plugin:mocha/recommended"],
  parserOptions: {
    ecmaVersion: 13,
  },
  rules: {
    "no-unused-vars": 1,
  },
};
