import { baseConfig } from "@acme/eslint-config/base";
import { reactConfig } from "@acme/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
