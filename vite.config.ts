import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    allowedHosts: [
      "imperquimia.local",
      "localhost",
      "localhost:3001",
      "api.imperquimia.local",
      "api.imperquimia.site-template.dev",
      "imperquimia.site-template.dev",
    ],
    host: "0.0.0.0",
    port: 3001,
  },
  preview: {
    allowedHosts: [
      "localhost",
      "localhost:3001",
      "api.imperquimia.site-template.dev",
      "imperquimia.site-template.dev",
    ],
    host: "0.0.0.0",
    port: 3001,
  },
});

export default config;
