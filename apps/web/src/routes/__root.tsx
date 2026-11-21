import { ClientOnly, createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

import glassCss from "@swiftui-canvas/glass/glass.css?url";
import appCss from "~/styles.css?url";
import workspaceCss from "~/workspace.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#f5f5f7" },
      { title: "SwiftUI Canvas · Development Preview" },
      {
        name: "description",
        content:
          "A development preview for composing iOS UI references for Muse and exporting SwiftUI implementation prompts.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23007aff'/%3E%3Cg fill='none' stroke='white' stroke-width='1.5'%3E%3Cpath d='M11 7h14v14M8 10h14v14'/%3E%3Crect x='5' y='13' width='14' height='14' rx='2'/%3E%3C/g%3E%3C/svg%3E" },
      { rel: "stylesheet", href: glassCss },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: workspaceCss },
    ],
  }),
  shellComponent: RootDocument,
  component: ClientApp,
});

// The static shell is shared by every route; browser-only screens mount
// after hydration rather than racing the shell's Suspense placeholders.
function ClientApp() {
  return <ClientOnly fallback={null}><Outlet /></ClientOnly>;
}

function RootDocument({ children }: { children: ReactNode }) {
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
