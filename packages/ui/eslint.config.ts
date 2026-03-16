import { defineConfig } from "eslint/config";

import { baseConfig } from "@morse-bot/eslint-config/base";
import { reactConfig } from "@morse-bot/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
