import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { workspacesRouter } from "./routes/workspaces/route";
import { formsRouter } from "./routes/forms/route";
import { analyticsRouter } from "./routes/analytics/route";
import { dashboardRouter } from "./routes/dashboard/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  workspaces: workspacesRouter,
  forms: formsRouter,
  analytics: analyticsRouter,
  dashboard: dashboardRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
