import { onRequestOptions as __api_softone_ts_onRequestOptions } from "C:\\Users\\tasos\\Desktop\\gusto-raro-b2b-portal_latest\\gusto-raro-b2b-portal\\gusto-raro-b2b-portal\\functions\\api\\softone.ts"
import { onRequestPost as __api_softone_ts_onRequestPost } from "C:\\Users\\tasos\\Desktop\\gusto-raro-b2b-portal_latest\\gusto-raro-b2b-portal\\gusto-raro-b2b-portal\\functions\\api\\softone.ts"

export const routes = [
    {
      routePath: "/api/softone",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_softone_ts_onRequestOptions],
    },
  {
      routePath: "/api/softone",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_softone_ts_onRequestPost],
    },
  ]