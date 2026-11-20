// Small helpers shared by every API function in api/.
// Handlers use the web-standard Request/Response API, which Vercel runs natively
// (and server/dev/vite-api.ts runs locally during `pnpm dev`).

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}

/** Wraps a handler so thrown errors become JSON error responses. */
export function route(handler: (request: Request) => Promise<unknown>) {
  return async (request: Request): Promise<Response> => {
    try {
      const result = await handler(request);
      return result instanceof Response ? result : json(result);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, { status: err.status });
      console.error(err);
      return json({ error: "Something went wrong on our side." }, { status: 500 });
    }
  };
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export const searchParam = (request: Request, name: string) => new URL(request.url).searchParams.get(name);
