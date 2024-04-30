module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:mocha/recommended",
    "prettier",
  ],
  overrides: [
    {
      env: {
        node: true,
        mocha: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["import", "@typescript-eslint", "mocha"],
  rules: {
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never", // temporary fix for #159
        ts: "never",
      },
    ],
    "import/named": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        packageDir: "./",
      },
    ],
    "mocha/no-mocha-arrows": "off",
    "no-console": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../*"],
            message:
              "Usage of relative parent imports is not allowed. Use path alias instead.",
          },
        ],
      },
    ],
    radix: ["error", "as-needed"],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
      },
    ],
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"],
    },
    "import/resolver": {
      typescript: {
        project: ["./tsconfig.json"],
      },
    },
  },
};
