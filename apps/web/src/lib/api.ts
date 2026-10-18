import { hc } from "hono/client";

import type { AppType } from "../../../server/src/app.js";

export const api = hc<AppType>(window.location.origin);
