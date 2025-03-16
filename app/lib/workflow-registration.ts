import { WorkflowRuntime } from "@dapr/dapr";
import { orderProcessingWorkflow,notifyActivity,verifyInventoryActivity,requestApprovalActivity,processPaymentActivity,updateInventoryActivity } from "./orderProcessingWorkflow";

export async function registerWorkflows() {
    const workflowWorker = new WorkflowRuntime();
  
  // Register the workflow and activities
  workflowWorker
  .registerWorkflow(orderProcessingWorkflow)
  .registerActivity(notifyActivity)
  .registerActivity(verifyInventoryActivity)
  .registerActivity(requestApprovalActivity)
  .registerActivity(processPaymentActivity)
  .registerActivity(updateInventoryActivity);

  try {
    await workflowWorker.start();
    console.log("Workflow runtime started successfully");
  } catch (error) {
    console.error("Error starting workflow runtime:", error);
  }
} 