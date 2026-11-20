// Dev-only: serves the Vercel functions in api/ from the Vite dev server, so
// `pnpm dev` runs frontend + API together with hot reload — no Vercel CLI needed.
//
// Mirrors Vercel's file routing: /api/sales -> api/sales.ts, calling its
// exported GET/POST/PUT/PATCH/DELETE handler with a web-standard Request.
import fs from "node:fs";
import type { IncomingMessage } from "node:http";
import path from "node:path";
import type { Plugin } from "vite";

type Handler = (request: Request) => Promise<Response> | Response;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export function vercelApiDev(): Plugin {
  return {
    name: "stash:vercel-api-dev",
    apply: "serve",
    configureServer(server) {
      const apiDir = path.resolve(server.config.root, "api");

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
        const route = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
        const file = path.join(apiDir, `${route}.ts`);
        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };

        if (!/^[\w/-]+$/.test(route) || !file.startsWith(apiDir + path.sep) || !fs.existsSync(file)) {
          return sendJson(404, { error: `No API route for ${url.pathname}` });
        }

        try {
          const mod = (await server.ssrLoadModule(file)) as Record<string, Handler | undefined>;
          const handler = mod[req.method ?? "GET"];
          if (!handler) return sendJson(405, { error: `${req.method} not allowed on ${url.pathname}` });

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") headers.set(key, value);
            else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
          }
          const body = await readBody(req);
          const response = await handler(new Request(url, { method: req.method, headers, body: body?.length ? body : undefined }));

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          if (err instanceof Error) server.ssrFixStacktrace(err);
          console.error(err);
          sendJson(500, { error: err instanceof Error ? err.message : "API error" });
        }
      });
    },
  };
}
