
import { defineRuntime } from "@mozaik-ai/core";
import { AppState } from "./types/appState.js";

const runtime = defineRuntime<AppState>();

export const {
  initializeRuntime,
  resolveRuntime,
  resolveParticipant,
  join,
  leave,
  sendMessage,
  sendEvent,
  runLoop,
} = runtime;

initializeRuntime({
  state: new AppState(),
});
