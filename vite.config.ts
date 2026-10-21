import { devtools } from "@tanstack/devtools-vite";
import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // Preoptimizar las dependencias descubiertas al cargar el cliente de Start
  // evita reemplazar sus chunks durante la primera navegacion.
  optimizeDeps: {
    include: [
      "@tanstack/history",
      "@tanstack/router-core",
      "@tanstack/router-core/ssr/client",
      "@tanstack/router-core/ssr/server",
      "h3-v2",
      "seroval",
    ],
  },
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
    strictPort: true,
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
