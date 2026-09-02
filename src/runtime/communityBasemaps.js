/*! Open Historia — portions (scenario bundle basemap helpers) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */

// Pure scenario-bundle basemap helpers: encode/decode a scenario's custom
// background between an embedded base64 payload and the raw files a .zip
// bundle ships (basemap.<ext> + preview.jpg). Formerly part of the community
// hub client; the hub is gone, the bundle format stays.

import { makeImageThumbnail, makeVectorThumbnail, sha256Hex } from "./basemapLibrary.js";

// UTF-8-safe base64 <-> string (the scenario bundle base64-encodes the
// background.json file bytes; plain atob/btoa mangle non-Latin1 vector data).
const utf8ToBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
const base64ToUtf8 = (b64) => decodeURIComponent(escape(atob(b64)));

// ---- data URL <-> bytes ---------------------------------------------------
const MIME_TO_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };
const EXT_TO_MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };
const mimeToExt = (mime) => MIME_TO_EXT[String(mime || "").toLowerCase()] || "png";
const extToMime = (ext) => EXT_TO_MIME[String(ext || "").toLowerCase()] || "image/png";

const dataUrlToBytes = (dataUrl) => {
  const [head = "", b64 = ""] = String(dataUrl).split(",");
  const mime = head.match(/data:([^;]+)/)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
};

const bytesToBase64 = (bytes) => {
  let bin = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
};

const bytesToDataUrl = (bytes, mime) => `data:${mime || "image/png"};base64,${bytesToBase64(bytes)}`;

// ---- Scenario-bundle background decode ------------------------------------

// Decode the bundle's embedded backgroundData into { kind, payload, hash }.
const readBundleBackground = async (bundle) => {
  const asset = bundle?.assets?.backgroundData;
  if (!asset || asset.mode !== "embedded" || !asset.data) return null;
  let payload;
  try {
    payload = JSON.parse(base64ToUtf8(asset.data));
  } catch {
    return null;
  }
  const kind = bundle?.data?.world?.background?.kind === "vector" ? "vector" : "image";
  const canonical = kind === "vector" ? (payload.geojson ? JSON.stringify(payload.geojson) : null) : payload.dataUrl;
  if (!canonical) return null;
  return { kind, payload, hash: await sha256Hex(canonical) };
};

// ---- Scenario zip bundle (image travels as a real file, not base64) -------
// Split a scenario bundle's embedded background out into raw bytes so the scenario
// can ship as a .zip (scenario.json + the basemap file + a preview) instead of one
// base64 blob. Handles both an image basemap (→ basemap.png/jpg…) and a generated
// VECTOR basemap (→ basemap.geojson, with a rendered preview). Returns null when
// there's nothing to split (no background, or an already-referenced one).
export const splitScenarioBundleImage = async (bundle) => {
  const bg = await readBundleBackground(bundle).catch(() => null);
  if (!bg) return null;
  if (bg.kind === "image" && bg.payload?.dataUrl) {
    const { bytes, mime } = dataUrlToBytes(bg.payload.dataUrl);
    const ext = mimeToExt(mime);
    const preview = await makeImageThumbnail(bg.payload.dataUrl, 320).catch(() => null);
    return {
      kind: "image",
      imageBytes: bytes,
      imageName: `basemap.${ext}`,
      imageMime: mime,
      previewBytes: preview ? dataUrlToBytes(preview).bytes : null,
      previewName: "preview.jpg",
      hash: bg.hash,
    };
  }
  if (bg.kind === "vector" && bg.payload?.geojson) {
    const bytes = new TextEncoder().encode(JSON.stringify(bg.payload.geojson));
    const preview = makeVectorThumbnail(bg.payload.geojson, 320);
    return {
      kind: "vector",
      imageBytes: bytes,
      imageName: "basemap.geojson",
      imageMime: "application/geo+json",
      previewBytes: preview ? dataUrlToBytes(preview).bytes : null,
      previewName: "preview.jpg",
      hash: bg.hash,
    };
  }
  return null;
};

// Re-embed a zip's basemap image back into the scenario bundle before import, so
// the server sees a normal embedded-background bundle. `imageName` is the zip
// entry name (e.g. "basemap.png") — its extension gives the mime.
export const embedScenarioBundleImage = (bundle, imageBytes, imageName) => {
  if (!bundle?.assets) return bundle;
  const mime = extToMime(String(imageName || "").split(".").pop());
  const dataUrl = bytesToDataUrl(imageBytes, mime);
  bundle.assets.backgroundData = {
    mode: "embedded",
    data: utf8ToBase64(JSON.stringify({ dataUrl })),
    fileName: "background.json",
    contentType: "application/json",
  };
  return bundle;
};

// Re-embed a zip's basemap GEOJSON back into the scenario bundle before import, so
// the server sees a normal embedded (vector) background bundle. Pairs with a
// scenario whose world.background.kind is already "vector".
export const embedScenarioBundleVector = (bundle, geojsonBytes) => {
  if (!bundle?.assets) return bundle;
  let geojson;
  try {
    geojson = JSON.parse(new TextDecoder().decode(geojsonBytes));
  } catch {
    return bundle;
  }
  bundle.assets.backgroundData = {
    mode: "embedded",
    data: utf8ToBase64(JSON.stringify({ geojson })),
    fileName: "background.json",
    contentType: "application/json",
  };
  return bundle;
};
