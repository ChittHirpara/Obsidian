import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function resolvePathSegments(context: RouteContext) {
  const params = await context.params;
  return params.path ?? [];
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const targetUrl = new URL(pathSegments.join("/"), `${BACKEND_URL}/`);
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const backendResponse = await fetch(targetUrl, init);
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: backendResponse.headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach backend";

    return NextResponse.json(
      {
        detail:
          "The backend API is unreachable from the Next.js proxy. Start the FastAPI server on port 8000 or set BACKEND_API_URL.",
        error: message,
        backendUrl: BACKEND_URL,
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, await resolvePathSegments(context));
}

export async function POST(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, await resolvePathSegments(context));
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, await resolvePathSegments(context));
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, await resolvePathSegments(context));
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, await resolvePathSegments(context));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    },
  });
}
