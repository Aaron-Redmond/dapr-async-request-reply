"use server";

import { WorkflowStatus } from "./lib/model";

export async function getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
  const status = await getWorkflowStatus(workflowId);
  return status;
}

