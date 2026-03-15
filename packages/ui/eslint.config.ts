import { defineConfig } from "eslint/config";

import { baseConfig } from "@moris-bot/eslint-config/base";
import { reactConfig } from "@moris-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
