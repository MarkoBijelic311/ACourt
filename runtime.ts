import { defineRuntime, RuntimeState } from "@mozaik-ai/core";
class AppState extends RuntimeState {}
const {
  initializeRuntime,
  resolveRuntime,
  resolveParticipant,
  join,
  leave,
  sendMessage,
  sendEvent,
  runLoop,
} = defineRuntime<AppState>();
initializeRuntime({ state: new AppState() });
