import type { NextApiRequest, NextApiResponse } from "next";

const ALLOWED_HOSTS = new Set([
  "images.pexels.com",
  "res.cloudinary.com",
  "flagcdn.com",
]);

function isAllowedUrl(input: string) {
  try {
    const parsed = new URL(input.startsWith("//") ? `https:${input}` : input);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = req.query.url;

  if (typeof url !== "string" || !url.trim() || !isAllowedUrl(url)) {
    return res.status(400).json({ detail: "Invalid image URL" });
  }

  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;

  try {
    const upstream = await fetch(normalizedUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers: {
        Accept: req.headers.accept || "image/*,*/*;q=0.8",
      },
    });

    res.status(upstream.status);

    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");

    if (req.method === "HEAD") {
      return res.end();
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch {
    return res.status(502).json({ detail: "Failed to proxy image" });
  }
}