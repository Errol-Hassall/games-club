import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { detectImageType } from "#/lib/validation";
import { ensureCoversDir, MAX_COVER_BYTES } from "#/server/covers";
import { requireUser } from "#/server/session";

export const Route = createFileRoute("/api/covers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        requireUser();
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          return new Response("No image was uploaded.", { status: 400 });
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) {
          return new Response("Image is empty or larger than 5 MB.", {
            status: 413,
          });
        }
        // Trust the bytes, not the content type the client claims.
        const type = detectImageType(bytes);
        if (!type) {
          return new Response(
            "That does not look like a PNG, JPEG, WebP or GIF image.",
            { status: 415 },
          );
        }
        // No extension: the content type is re-detected from the bytes on
        // every request, so a renamed file can never get the wrong type.
        const filename = randomUUID();
        await writeFile(join(ensureCoversDir(), filename), bytes);
        return Response.json({ url: `/api/covers/${filename}` });
      },
    },
  },
});
