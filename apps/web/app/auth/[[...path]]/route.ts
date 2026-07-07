import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return handleProxy(req, path || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  return handleProxy(req, path || []);
}

async function handleProxy(req: NextRequest, pathParts: string[]) {
  const path = pathParts.join("/");
  const apiTarget = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Prevent infinite loop if apiTarget is mistakenly set to the frontend URL/origin
  try {
    const currentHost = req.headers.get("host") || req.nextUrl.host;
    const targetUrl = new URL(apiTarget, `http://${currentHost}`);
    
    if (targetUrl.host === currentHost) {
      console.error(`Loop detected: apiTarget (${apiTarget}) matches current host (${currentHost})`);
      return new NextResponse(
        `Configuration Error: Loop detected. NEXT_PUBLIC_API_URL is set to or resolved to the frontend URL/host (${apiTarget}), which causes the proxy to fetch itself recursively. Please configure NEXT_PUBLIC_API_URL to point to your backend API server (e.g., https://my-form-api.mrmadhukar.in) in your environment variables.`,
        { status: 508 }
      );
    }
  } catch (e) {
    console.error("Error checking for proxy loop:", e);
  }

  const url = new URL(`${apiTarget}/auth/${path}`);
  url.search = req.nextUrl.search;

  const headers = new Headers();
  
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method === "POST") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url.toString(), init);
    const resHeaders = new Headers();
    
    const skipHeaders = ["set-cookie", "content-encoding", "content-length", "transfer-encoding"];
    res.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    if (res.headers.has("set-cookie")) {
      const cookies = res.headers.getSetCookie();
      for (const cookie of cookies) {
        resHeaders.append("set-cookie", cookie);
      }
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        resHeaders.set("location", location);
      }
    }

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
