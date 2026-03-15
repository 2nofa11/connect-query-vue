import tsdownConfig from "./tsdown.config.ts";

import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: tsdownConfig,
  fmt: { ignorePatterns: ["connect-query-es/**"] },
  lint: {
    ignorePatterns: ["connect-query-es/**"],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    environment: "happy-dom",
    exclude: ["connect-query-es/**", "examples/**", "node_modules/**"],
  },
  run: {
    tasks: {
      "build:test-utils": {
        command: "vp pm run build --workspace=packages/test-utils",
        cwd: "connect-query-es",
        cache: true,
      },
      ci: {
        command: "vp test && vp check",
        dependsOn: ["build:test-utils"],
      },
      "update-coverage": {
        command: "bash scripts/update-coverage.sh",
      },
      release: {
        command: "vp exec bumpp patch --commit --tag --push",
        cache: false,
      },
    },
  },
});
