import { baseConfig, restrictEnvAccess } from "@morse-bot/eslint-config/base";
import { reactConfig } from "@morse-bot/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
