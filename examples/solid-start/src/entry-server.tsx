// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>solid-streamdown on SolidStart</title>
          {assets}
        </head>
        <body class="bg-background text-foreground">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
