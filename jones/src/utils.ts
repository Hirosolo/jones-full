import type { NextApiRequest, NextApiResponse } from "next";
import type { AsyncAPIHandler } from "src/types/shared";

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./lib/config";

export function setCookie(key: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = key + "=" + value + ";expires=" + expires.toUTCString();
}



type CloudinaryBatchResultType = Promise<
  {
    secure_url?: string;
    url?: string;
    width?: number;
    height?: number;
    original_filename?: string;
    format?: string;
  }[]
>;
export function cloudinaryUpload(files: FileList): CloudinaryBatchResultType {
  const formData = new FormData();
  const results = [].map.call(files, (file) => {
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    return fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )
      .then((res) => res.json())
      .catch();
  });

  return Promise.all(results) as CloudinaryBatchResultType;
}

export const compareObjects = (obj1: object, obj2: object) =>
  Object.is(JSON.stringify(obj1), JSON.stringify(obj2));

export function buildProductListingHref(
  params: Record<string, string | number | Array<string | number> | undefined> = {}
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (key === "price" && Array.isArray(value)) {
      const [minPrice, maxPrice] = value;
      if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
        query.set("min_price", String(minPrice));
      }
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
        query.set("max_price", String(maxPrice));
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          query.append(key, String(item));
        }
      });
      return;
    }

    query.set(key, String(value));
  });

  const search = query.toString();
  return search ? `/p?${search}` : "/p";
}

export const getPathString = (url: string) =>
  url
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export class ServerError extends Error {
  status: number;
  meta?: any;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ServerError";
    this.status = status;
  }
}

export const catchAsyncErrors =
  (func: AsyncAPIHandler) =>
  (req: NextApiRequest, res: NextApiResponse, next: Function) =>
    Promise.resolve(func(req, res, next)).catch((e) => next(e));

export const isSelectKey = (event: { key: string; keyCode: number }) =>
  event.key == "Enter" ||
  event.keyCode == 13 ||
  event.key == " " ||
  event.keyCode == 32;

// https://dev.to/ycmjason/how-to-create-range-in-javascript-539i
export function range(start: number, end: number): number[] {
  if (
    typeof start != "number" ||
    typeof end != "number" ||
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return [0];
  }
  if (start >= end) return [start];
  return [start, ...range(start + 1, end)];
}

export const listToEnum = <T extends string | number>(list: T[]) => {
  return list.reduce<{ [K in T]: K }>((enumAccumulated, enumKey) => {
    enumAccumulated[enumKey] = enumKey;
    return enumAccumulated;
  }, Object.create({}));
};

export const map = (
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  value: number
) => ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

export const throttle = (callback: Function, timeout: number) => {
  let wait = false;
  return function (this: any, ...args: unknown[]) {
    if (!wait) {
      callback.apply(this, args);
      wait = true;
      setTimeout(() => (wait = false), timeout);
    }
  };
};
