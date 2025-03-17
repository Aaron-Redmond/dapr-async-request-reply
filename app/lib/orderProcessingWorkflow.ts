import { Task, WorkflowActivityContext, WorkflowContext, TWorkflow, DaprClient } from "@dapr/dapr";
import { InventoryItem, InventoryRequest, InventoryResult, OrderNotification, OrderPayload, OrderPaymentRequest, OrderResult } from "./model";

const daprClient = new DaprClient();
const storeName = "statestore";

// Defines Notify Activity. This is used by the workflow to send out a notification
export const notifyActivity = async (ctx: WorkflowActivityContext, orderNotification: OrderNotification) => {
  console.log(orderNotification.message);
  return;
};

//Defines Verify Inventory Activity. This is used by the workflow to verify if inventory is available for the order
export const verifyInventoryActivity = async (_: WorkflowActivityContext, inventoryRequest: InventoryRequest) => {
  console.log(`Verifying inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`);
  const result = await daprClient.state.get(storeName, inventoryRequest.itemName);
  if (result == undefined || result == null) {
    return new InventoryResult(false, undefined);
  }
  const inventoryItem = result as InventoryItem;
  console.log(`There are ${inventoryItem.quantity} ${inventoryItem.itemName} in stock`);

  if (inventoryItem.quantity >= inventoryRequest.quantity) {
    return new InventoryResult(true, inventoryItem)
  }
  return new InventoryResult(false, undefined);
}

export const requestApprovalActivity = async (_: WorkflowActivityContext, orderPayLoad: OrderPayload) => {
  console.log(`Requesting approval for order ${orderPayLoad.itemName}`);
  return true;
}

export const processPaymentActivity = async (_: WorkflowActivityContext, orderPaymentRequest: OrderPaymentRequest) => {
  console.log(`Processing payment for order ${orderPaymentRequest.itemBeingPurchased}`);
  console.log(`Payment of ${orderPaymentRequest.amount} for ${orderPaymentRequest.quantity} ${orderPaymentRequest.itemBeingPurchased} processed successfully`);
  return true;
}

export const updateInventoryActivity = async (_: WorkflowActivityContext, inventoryRequest: InventoryRequest) => {
  console.log(`Updating inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`);
  const result = await daprClient.state.get(storeName, inventoryRequest.itemName);
  if (result == undefined || result == null) {
    return new InventoryResult(false, undefined);
  }
  const inventoryItem = result as InventoryItem;
  inventoryItem.quantity = inventoryItem.quantity - inventoryRequest.quantity;
  if (inventoryItem.quantity < 0) {
    console.log(`Insufficient inventory for ${inventoryRequest.requestId} of ${inventoryRequest.quantity} ${inventoryRequest.itemName}`);
    return new InventoryResult(false, undefined);
  }
  await daprClient.state.save(storeName, [
    {
      key: inventoryRequest.itemName,
      value: inventoryItem,
    }
  ]);
  console.log(`Inventory updated for ${inventoryRequest.requestId}, there are now ${inventoryItem.quantity} ${inventoryItem.itemName} in stock`);
  return new InventoryResult(true, inventoryItem);
}

  // Initialize status updates array
  interface StatusUpdate {
    stage: string;
    description: string;
    status: 'running' | 'completed' | 'failed';
    messages: Array<{
      text: string;
      timestamp: string;
    }>;
    startedAt: string;
    completedAt?: string;
  }

  interface StageDescription {
    stage: string;
    description: string;
  }

  const stageDescriptions: StageDescription[] = [
    {
      stage: 'order_processing',
      description: 'Processing the order through various stages including inventory check, approval, payment, and inventory update'
    },
    {
      stage: 'inventory_check',
      description: 'Verifying if requested items are available in sufficient quantity'
    },
    {
      stage: 'approval',
      description: 'Getting approval for high-value orders exceeding $5000'
    },
    {
      stage: 'payment',
      description: 'Processing payment for the order'
    },
    {
      stage: 'inventory_update',
      description: 'Updating inventory levels after successful payment'
    }
  ];

export const orderProcessingWorkflow: TWorkflow = async function* (ctx: WorkflowContext, orderPayLoad: OrderPayload):  any {
  const orderId = ctx.getWorkflowInstanceId();
  
  const statusUpdates: StatusUpdate[] = [];
  const addStatus = (stage: string, wfDate: Date, message: string, status: 'running' | 'completed' | 'failed') => {
    const timestamp = wfDate.toISOString();
    const existingStageIndex = statusUpdates.findIndex(s => s.stage === stage);
    
    if (existingStageIndex === -1) {
      // Find stage description
      const stageInfo = stageDescriptions.find(sd => sd.stage === stage);
      if (!stageInfo) {
        console.warn(`No description found for stage: ${stage}`);
      }
      
      // Create new stage
      statusUpdates.push({
        stage,
        description: stageInfo?.description || 'No description available',
        status,
        messages: [{
          text: message,
          timestamp
        }],
        startedAt: timestamp,
        ...(status !== 'running' ? { completedAt: timestamp } : {})
      });
    } else {
      // Update existing stage
      const existingStage = statusUpdates[existingStageIndex];
      existingStage.messages.push({
        text: message,
        timestamp
      });
      if (status !== 'running') {
        existingStage.status = status;
        existingStage.completedAt = timestamp;
      }
    }
    
    ctx.setCustomStatus(JSON.stringify({ updates: statusUpdates }));
  };

  // Initial status
  console.log(`Processing order ${orderId}...`);
  addStatus('order_processing', ctx.getCurrentUtcDateTime(), 'Starting order processing...', 'running');

  // Initial delay
  yield ctx.createTimer(5);

  const orderNotification: OrderNotification = {
    message: `Received order ${orderId} for ${orderPayLoad.quantity} ${orderPayLoad.itemName} at a total cost of ${orderPayLoad.totalCost}`,
  };
  yield ctx.callActivity(notifyActivity, orderNotification);
  addStatus('order_processing', ctx.getCurrentUtcDateTime(),`Order received: ${orderPayLoad.quantity} ${orderPayLoad.itemName}`, 'completed');


  // Start inventory check
  addStatus('inventory_check', ctx.getCurrentUtcDateTime(),'Starting inventory verification...', 'running');
  const inventoryRequest = new InventoryRequest(orderId, orderPayLoad.itemName, orderPayLoad.quantity);
  addStatus('inventory_check',ctx.getCurrentUtcDateTime(), `Checking inventory for ${orderPayLoad.quantity} ${orderPayLoad.itemName}`, 'running');
  const inventoryResult = yield ctx.callActivity(verifyInventoryActivity, inventoryRequest);

  if (!inventoryResult.success) {
    addStatus('inventory_check',ctx.getCurrentUtcDateTime(), `Insufficient inventory for order ${orderId}`, 'failed');
    const orderNotification: OrderNotification = {
      message: `Insufficient inventory for order ${orderId}`,
    };
    yield ctx.callActivity(notifyActivity, orderNotification);
    return new OrderResult(false);
  }
  addStatus('inventory_check',ctx.getCurrentUtcDateTime(), 'Inventory verification completed successfully', 'completed');


  if (orderPayLoad.totalCost > 5000) {
    addStatus('approval', ctx.getCurrentUtcDateTime(),'Starting approval process...', 'running');
    addStatus('approval', ctx.getCurrentUtcDateTime(), `Requesting approval for order total: $${orderPayLoad.totalCost}`, 'running');
    yield ctx.callActivity(requestApprovalActivity, orderPayLoad);
    
    ctx.createTimer(5);
    const tasks: Task<any>[] = [];
    const approvalEvent = ctx.waitForExternalEvent("approval_event");
    tasks.push(approvalEvent);
    const timeOutEvent = ctx.createTimer(30);
    tasks.push(timeOutEvent);
    const winner = ctx.whenAny(tasks);

    if (winner == timeOutEvent) {
      addStatus('approval', ctx.getCurrentUtcDateTime(),'Approval process timed out', 'failed');
      const orderNotification: OrderNotification = {
        message: `Order ${orderId} has been cancelled due to approval timeout.`,
      };
      yield ctx.callActivity(notifyActivity, orderNotification);
      addStatus('approval', ctx.getCurrentUtcDateTime(),'Order failed due to approval timeout', 'failed');
      return new OrderResult(false);
    }
    const approvalResult = approvalEvent.getResult();
    if (!approvalResult) {
      addStatus('approval', ctx.getCurrentUtcDateTime(),'Order was not approved', 'failed');
      const orderNotification: OrderNotification = {
        message: `Order ${orderId} was not approved.`,
      };
      yield ctx.callActivity(notifyActivity, orderNotification);
      addStatus('approval', ctx.getCurrentUtcDateTime(),'Order failed due to approval rejection', 'failed');
      return new OrderResult(false);
    }
    addStatus('approval', ctx.getCurrentUtcDateTime(),'Order approved successfully', 'completed');
  }

  // Delay before payment processing
 
  
  // Start payment processing
  addStatus('payment', ctx.getCurrentUtcDateTime(),'Starting payment processing...', 'running');
  yield ctx.createTimer(5);
  addStatus('payment', ctx.getCurrentUtcDateTime(), `Processing payment of $${orderPayLoad.totalCost}`, 'running');
  const orderPaymentRequest = new OrderPaymentRequest(orderId, orderPayLoad.itemName, orderPayLoad.totalCost, orderPayLoad.quantity);
  const paymentResult = yield ctx.callActivity(processPaymentActivity, orderPaymentRequest);

  if (!paymentResult) {
    addStatus('payment', ctx.getCurrentUtcDateTime(), 'Payment processing failed', 'failed');
    const orderNotification: OrderNotification = {
      message: `Payment for order ${orderId} failed`,
    };
    yield ctx.callActivity(notifyActivity, orderNotification);
    addStatus('payment', ctx.getCurrentUtcDateTime(), 'Order failed due to payment failure', 'failed');
    return new OrderResult(false);
  }
  addStatus('payment', ctx.getCurrentUtcDateTime(), 'Payment processed successfully', 'completed');

  // Delay before inventory update

  
  // Start inventory update
  addStatus('inventory_update', ctx.getCurrentUtcDateTime(), 'Starting inventory update...', 'running');
  yield ctx.createTimer(5);
  addStatus('inventory_update', ctx.getCurrentUtcDateTime(), `Updating inventory for ${orderPayLoad.quantity} ${orderPayLoad.itemName}`, 'running');
  const updatedResult = yield ctx.callActivity(updateInventoryActivity, inventoryRequest);
  
  if (!updatedResult.success) {
    addStatus('inventory_update', ctx.getCurrentUtcDateTime(), 'Failed to update inventory', 'failed');
    const orderNotification: OrderNotification = {
      message: `Failed to update inventory for order ${orderId}`,
    };
    yield ctx.callActivity(notifyActivity, orderNotification);
    addStatus('inventory_update', ctx.getCurrentUtcDateTime(), 'Order failed due to inventory update failure', 'failed');
    return new OrderResult(false);
  }
  addStatus('inventory_update', ctx.getCurrentUtcDateTime(),  'Inventory updated successfully', 'completed');

  const orderCompletedNotification: OrderNotification = {
    message: `order ${orderId} processed successfully!`,
  };
  yield ctx.callActivity(notifyActivity, orderCompletedNotification);

  console.log(`Order ${orderId} processed successfully!`);
  return new OrderResult(true);
}
