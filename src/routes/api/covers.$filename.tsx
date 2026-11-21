import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { detectImageType } from "#/lib/validation";
import { coversDir, isValidCoverFilename } from "#/server/covers";

export const Route = createFileRoute("/api/covers/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const filename = params.filename;
        if (!isValidCoverFilename(filename)) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const bytes = await readFile(join(coversDir(), filename));
          // Files are stored without an extension, so the content type comes
          // from the bytes themselves.
          const type = detectImageType(bytes);
          if (!type) {
            return new Response("Not found", { status: 404 });
          }
          return new Response(bytes, {
            headers: {
              "Content-Type": type === "jpeg" ? "image/jpeg" : `image/${type}`,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
