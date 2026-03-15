import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@moris-bot/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
