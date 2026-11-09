import type { Hono } from "hono";

// @ts-ignore Compiled server entrypoint is generated during the build.
import app from "./apps/server/dist/apps/server/src/vercel-app.js";

const handler: Hono = app;

export default handler;
