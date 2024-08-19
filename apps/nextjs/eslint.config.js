import baseConfig, { restrictEnvAccess } from "@rally/eslint-config/base";
import nextjsConfig from "@rally/eslint-config/nextjs";
import reactConfig from "@rally/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
