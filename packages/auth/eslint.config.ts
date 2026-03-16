import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@morse-bot/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
