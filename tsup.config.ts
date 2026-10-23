import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts", "src/react/auto-merge-plugin.tsx", "src/react/AutomergePlugin.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "lexical", "@lexical/react", "@automerge/automerge-repo"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
