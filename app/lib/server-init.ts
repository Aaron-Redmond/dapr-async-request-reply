import { CommunicationProtocolEnum } from "@dapr/dapr";
import { registerWorkflows } from "./workflow-registration";
import { DaprWorkflowClient } from "@dapr/dapr";
import { InventoryItem, OrderPayload } from "./model";
import { orderProcessingWorkflow } from "./orderProcessingWorkflow";

let isInitialized = false;

export async function initializeServer() {
  if (!isInitialized) {
    await registerWorkflows();

   
    isInitialized = true;
    console.log("Dapr workflow registration completed");
  }
} 