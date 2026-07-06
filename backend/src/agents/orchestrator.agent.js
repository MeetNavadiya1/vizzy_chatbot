import { Agent, Runner } from "@openai/agents";
import { orchestratorPrompt } from "../prompts/orchestrator.prompt.js";
import { imageAgent } from "./image.agent.js";
import { textAgent } from "./text.agent.js";

export const orchestrator = Agent.create({
  name: "Orchestrator",
  instructions: orchestratorPrompt,
  handoffs: [imageAgent, textAgent],
  handoffDescription: "Routes requests to the appropriate specialist agent.",
});

const runner = new Runner();

export async function runOrchestratedWorkflow(input, context) {
  return runner.run(orchestrator, input, {
    context,
    maxTurns: 6,
  });
}
