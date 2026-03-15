import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vue()],
  fmt: { ignorePatterns: ["src/gen/**"] },
  lint: { ignorePatterns: ["src/gen/**"] },
  test: {
    environment: "happy-dom",
  },
});
