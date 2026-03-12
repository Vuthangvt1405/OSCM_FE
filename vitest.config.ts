import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
    },
  },
});
});
      "@": path.resolve(__dirname, "app"),
    },
  },
});

