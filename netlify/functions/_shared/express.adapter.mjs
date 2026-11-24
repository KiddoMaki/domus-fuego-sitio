// Adaptador: las Netlify Functions no contienen lógica, solo adaptan el evento
// a Express y delegan en la MISMA app que se usa en local (src/app.js).
import serverless from "serverless-http";
import { createApp } from "../../../src/app.js";

const appHandler = serverless(createApp(), { requestId: "x-request-id" });

function requestPath(event, resource) {
  const raw = String(event.path ?? "");
  if (raw === "/api" || raw.startsWith("/api/")) return raw;
  if (resource) {
    const suffix = raw.replace(/^\/\.netlify\/functions\/[^/]+/, "");
    return `/api/${resource}${suffix}`;
  }
  return raw.replace(/^\/\.netlify\/functions\/api/, "/api") || "/api";
}

function normalize(event, resource) {
  return {
    ...event,
    httpMethod: event.httpMethod ?? "GET",
    path: requestPath(event, resource),
    headers: event.headers ?? {},
    body: event.isBase64Encoded && event.body
      ? Buffer.from(event.body, "base64").toString("utf8")
      : (event.body ?? ""),
    requestContext: {
      ...(event.requestContext ?? {}),
      identity: {
        sourceIp: "127.0.0.1",
        ...(event.requestContext?.identity ?? {}),
      },
    },
  };
}

export function adapt(resource) {
  return (event, context) => appHandler(normalize(event, resource), context);
}

export const handler = (event, context) => appHandler(normalize(event), context);
