import type { NextApiRequest, NextApiResponse } from "next";

import { DJANGO_BASE_URL } from "@Lib/config";

const ALLOWED_METHODS = ["GET", "HEAD", "OPTIONS"];

function buildBackendUrl(pathSegments: string[] | undefined, query: NextApiRequest["query"]): string {
  const pathname = `/api/shop/${(pathSegments || []).map(encodeURIComponent).join("/")}`;
  const url = new URL(pathname.endsWith("/") ? pathname : `${pathname}/`, DJANGO_BASE_URL);

  Object.entries(query).forEach(([key, value]) => {
    if (key === "path") return;
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ALLOWED_METHODS.includes(req.method || "GET")) {
    res.setHeader("Allow", ALLOWED_METHODS);
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const pathSegments = Array.isArray(req.query.path) ? req.query.path : [];
  const joinedPath = pathSegments.join("/").toLowerCase();
  const isCmsEndpoint = joinedPath.startsWith("cms/");
  const backendUrl = buildBackendUrl(pathSegments, req.query);

  try {
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      cache: isCmsEndpoint ? "no-store" : undefined,
      headers: {
        Accept: req.headers.accept || "application/json",
      },
    });

    const contentType = backendResponse.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await backendResponse.json().catch(() => ({}))
      : await backendResponse.text();

    res.status(backendResponse.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    if (isCmsEndpoint) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    return typeof body === "string" ? res.send(body) : res.json(body);
  } catch (error) {
    return res.status(502).json({ detail: "Failed to proxy catalog request" });
  }
}