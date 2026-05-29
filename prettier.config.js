//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  printWidth: 80,
  overrides: [
    {
      files: ["*.ts", "*.js", "*.tsx", "*.jsx"],
      options: {
        parser: "typescript",
      },
    },
  ],
};

export default config;
