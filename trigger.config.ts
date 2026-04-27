import { defineConfig } from "@trigger.dev/sdk/v3";

import { getTriggerProjectRef } from "./lib/trigger/runtime";

export default defineConfig({
  project: getTriggerProjectRef(),
  dirs: ["./trigger"],
  maxDuration: 300,
  logLevel: "info",
});