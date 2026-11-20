import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from "@tanstack/react-router";
import { getCurrentUser } from "#/server/auth";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => ({ user: await getCurrentUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "description",
        content:
          "A self-hosted games club: suggest games, vote, spin the wheel, read the room, and keep a record of every month played.",
      },
      { name: "theme-color", content: "#f3ecde" },
      { title: "Games Club" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <CentredMessage
      eyebrow="404"
      title="That page is not on the shelf."
      body="The link may be old, or the game may have moved on to another month."
    />
  ),
  errorComponent: () => (
    <CentredMessage
      eyebrow="Something went wrong"
      title="The club room is a mess."
      body="Please refresh the page. If it keeps happening, check the server logs."
    />
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function CentredMessage({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-3 text-4xl text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
        <Link to="/" className="btn-primary mt-6">
          Back to the club
        </Link>
      </div>
    </main>
  );
}
