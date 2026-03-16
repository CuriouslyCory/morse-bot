import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@morse-bot/eslint-config/base";
import { reactConfig } from "@morse-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
