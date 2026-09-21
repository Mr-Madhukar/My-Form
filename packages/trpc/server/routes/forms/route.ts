import { router } from "../../trpc";
import * as crud from "./crud";
import { formsVersionsRouter } from "./versions";
import { formsPublicRouter } from "./public";
import { formsResponsesRouter } from "./responses";

export const formsRouter = router({
  create: crud.create,
  list: crud.list,
  get: crud.get,
  softDelete: crud.softDelete,
  restore: crud.restore,
  setVisibility: crud.setVisibility,
  toggleAccepting: crud.toggleAccepting,
  setResponseLimit: crud.setResponseLimit,
  connectGoogleSheets: crud.connectGoogleSheets,
  disconnectGoogleSheets: crud.disconnectGoogleSheets,
  getLeadScoring: crud.getLeadScoring,
  toggleLeadScoring: crud.toggleLeadScoring,
  getPaymentConfig: crud.getPaymentConfig,
  updatePaymentConfig: crud.updatePaymentConfig,
  versions: formsVersionsRouter,
  public: formsPublicRouter,
  responses: formsResponsesRouter,
});
