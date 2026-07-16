import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { AstroIntegration } from "astro";

function getFilesRecursively(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    return entry.isDirectory() ? getFilesRecursively(path) : path;
  });
}

export function createIntegrationWatcher(directory: string): AstroIntegration {
  return {
    name: "playground/integration-watcher",
    hooks: {
      "astro:config:setup": ({
        addWatchFile,
        command,
        updateConfig,
      }) => {
        if (command !== "dev") {
          return;
        }

        const paths = getFilesRecursively(directory);

        for (const path of paths) {
          addWatchFile(path);
        }

        updateConfig({
          vite: {
            plugins: [
              {
                name: "playground-integration-watcher",
                buildStart() {
                  for (const path of paths) {
                    this.addWatchFile(path);
                  }
                },
              },
            ],
          },
        });
      },
    },
  };
}
