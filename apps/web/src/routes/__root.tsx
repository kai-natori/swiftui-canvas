import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import glassCss from "@swiftui-canvas/glass/glass.css?url";
import appCss from "~/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "SwiftUI Canvas" },
      {
        name: "description",
        content:
          "Assemble SwiftUI screens in the browser with Liquid Glass, and export a prompt for AI coding tools.",
      },
    ],
    links: [
      { rel: "stylesheet", href: glassCss },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
