import { defineConfig } from "eslint/config";

import { baseConfig } from "@moris-bot/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
