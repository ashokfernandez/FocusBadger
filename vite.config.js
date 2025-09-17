import { defineConfig } from "vite";

const react = await import("@vitejs/plugin-react")
  .then((mod) => mod.default)
  .catch(() => () => ({ name: "noop-react-plugin" }));

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  test: {
    environment: "node",
    globals: true
  }
});
