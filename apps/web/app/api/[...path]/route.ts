import type { NextRequest } from "next/server";

const API_ORIGIN = "https://contribly-410149640401.europe-west1.run.app";

export const dynamic = "force-dynamic";

type RouteContext = { params: { path: string[] } };

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const path = context.params.path.map(encodeURIComponent).join("/");
  const target = new URL(`/api/${path}`, API_ORIGIN);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", "https");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (getSetCookie) {
    responseHeaders.delete("set-cookie");
    for (const cookie of getSetCookie.call(upstream.headers)) {
      responseHeaders.append("set-cookie", cookie);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
