import { DaprClient } from "@dapr/dapr";
import { NextResponse } from "next/server";

const daprClient = new DaprClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get('workflowId');

  if (!workflowId) {
    return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start monitoring the workflow
  const intervalId = setInterval(async () => {
    try {
      const status = await daprClient.workflow.get(workflowId);
      const data = {
        runtimeStatus: status.runtimeStatus,
        createdAt: status.createdAt,
        lastUpdatedAt: status.lastUpdatedAt,
        properties: status.properties
      };

      // Send the status update
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
      );

      // If workflow is completed or failed, stop monitoring
      const statusString = String(status.runtimeStatus).toUpperCase();
      if (statusString === 'COMPLETED' || statusString === 'FAILED') {
        clearInterval(intervalId);
        await writer.close();
      }
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      clearInterval(intervalId);
      await writer.close();
    }
  }, 1000); // Check every second

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 