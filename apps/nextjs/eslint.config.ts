import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@moris-bot/eslint-config/base";
import { nextjsConfig } from "@moris-bot/eslint-config/nextjs";
import { reactConfig } from "@moris-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
