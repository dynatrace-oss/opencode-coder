import type { Plugin } from "@opencode-ai/plugin";

export const HelloWorld: Plugin = async () => {
  console.log("Hello World! Plugin loaded.");

  return {};
};
