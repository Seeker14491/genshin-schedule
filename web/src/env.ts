import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  /** URL of the sync server's API. Embedded into the build, so changing it requires rebuilding. */
  PUBLIC_API_URL: {
    public: true,
    static: true,
    schema: (value) => value || "https://genshin-schedule-sync.caprover.seekr.pw/api/v1",
  },
});
