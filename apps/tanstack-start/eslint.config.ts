import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@moris-bot/eslint-config/base";
import { reactConfig } from "@moris-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
