import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@morse-bot/eslint-config/base";
import { nextjsConfig } from "@morse-bot/eslint-config/nextjs";
import { reactConfig } from "@morse-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**", "public/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
