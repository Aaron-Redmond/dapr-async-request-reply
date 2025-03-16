import { NextResponse } from "next/server";
import { DaprClient, DaprWorkflowClient, CommunicationProtocolEnum } from "@dapr/dapr";
import { OrderPayload, InventoryItem } from "@/app/lib/model";
import { orderProcessingWorkflow } from "@/app/lib/orderProcessingWorkflow";
import { initializeServer } from "@/app/lib/server-init";
const daprClient = new DaprClient();
export async function POST(request: Request) {
  try {
    initializeServer();
    const { workflowId, orderPayload } = await request.json();

    if (!workflowId || !orderPayload) {
      return NextResponse.json(
        { error: "workflowId and orderPayload are required" },
        { status: 400 }
      );
    }
console.log("workflowId", workflowId);
console.log("orderPayload", orderPayload);
  const workflowClient = new DaprWorkflowClient();
  const daprHost = process.env.DAPR_HOST ?? "127.0.0.1";
  const daprPort = process.env.DAPR_GRPC_PORT ?? "50001";

  const daprClient = new DaprClient({
    daprHost,
    daprPort,
    communicationProtocol: CommunicationProtocolEnum.GRPC,
  });

  const storeName = "statestore";

  const inventory = new InventoryItem("car", 5000, 10);
  const key = inventory.itemName;

  await daprClient.state.save(storeName, [
    {
      key: key,
      value: inventory,
    }
  ]);

  const order = new OrderPayload("car", 5000, 1);
    // Start the workflow
    const id = await workflowClient.scheduleNewWorkflow(orderProcessingWorkflow, orderPayload, workflowId);
    console.log(`Orchestration scheduled with ID: ${id}`);

    return NextResponse.json({
      status: "success",
      message: "Workflow started successfully",
      workflowId
    });
  } catch (error) {
    console.error("Failed to start workflow:", error);
    return NextResponse.json(
      { error: "Failed to start workflow" },
      { status: 500 }
    );
  }
} 