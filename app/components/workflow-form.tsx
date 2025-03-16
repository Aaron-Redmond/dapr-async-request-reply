"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Step, StepContent, StepDesc, StepItem, StepNumber, StepTitle } from "./step-list";
import { Skeleton } from "./skeleton";
import { StatusUpdate, WorkflowStatus } from "../lib/model";



const resolveStepStatus = (workflowStatus: WorkflowStatus, index: number): 'done' | 'loading' | 'init' => {
  if(!workflowStatus) return 'init';
  // If workflow is completed, all steps are done
  if (workflowStatus.runtimeStatus === 'COMPLETED') {
    return 'done';
  }

  // Try to get custom status
  try {
    if (workflowStatus.properties["dapr.workflow.custom_status"]) {
      const customStatus = JSON.parse(workflowStatus.properties["dapr.workflow.custom_status"]);
      if (customStatus.updates && customStatus.updates[index]) {
        const stageStatus = customStatus.updates[index].status;
        if (stageStatus === 'completed') {
          return 'init';
        }
        if (stageStatus === 'running') {
          return 'loading';
        }
      }
    }
  } catch (error) {
    console.error('Error parsing custom status:', error);
  }

  return 'init';
};

export const WorkflowForm = () => {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    totalCost: 0,
  });
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (currentWorkflowId) {
      eventSource = new EventSource(`/api/workflow-status?workflowId=${currentWorkflowId}`);
      
      eventSource.onmessage = (event) => {
        setWorkflowLoading(false);
        const data = JSON.parse(event.data);
        setWorkflowStatus(data);

        if (data.properties["dapr.workflow.custom_status"]) {
          try {
            const customStatus = JSON.parse(data.properties["dapr.workflow.custom_status"]);
            if (customStatus.updates) {
              setStatusUpdates(customStatus.updates);
            }
          } catch (error) {
            console.error('Failed to parse custom status:', error);
          }
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    }

    return () => {
      eventSource?.close();
    };
  }, [currentWorkflowId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWorkflowStatus(null);
    setWorkflowLoading(true);
    setStatus(null);
    setStatusUpdates([]);
   

    try {
      const workflowId = uuidv4();
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId,
          orderPayload: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start workflow");
      }

      setCurrentWorkflowId(workflowId);
      setStatus({
        type: "success",
        message: `Workflow started successfully with ID: ${workflowId}`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to start workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Start Order Processing Workflow</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
            Item Name
          </label>
          <input
            type="text"
            id="itemName"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700">
            Total Cost
          </label>
          <input
            type="number"
            id="totalCost"
            min="0"
            value={formData.totalCost}
            onChange={(e) => setFormData({ ...formData, totalCost: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? "Starting Workflow..." : "Start Workflow"}
        </button>
      </form>

{ workflowLoading && (
   <Skeleton />
)}
    {statusUpdates.length > 0 && (
         <div className="px-8 mx-auto  max-w-screen-sm">
      <div className="mt-16 md:mt-16">

    
        <Step >
          {statusUpdates.map((update, index) => (
            <StepItem status={resolveStepStatus(workflowStatus, index)} key={index}>
               <StepNumber status={resolveStepStatus(workflowStatus, index)} order={index + 1} ></StepNumber>
                <StepTitle>{update.stage}</StepTitle>
                <StepDesc>
                  {update.description}
                </StepDesc>
              
                <StepContent>
                {update.messages.map((msg, msgIndex) => (
                  <div key={msgIndex} className="flex items-start space-x-2 text-sm">
                    <span className="text-gray-500 whitespace-nowrap">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-gray-700">{msg.text}</span>
                  </div>
                ))}
                </StepContent>
            </StepItem> 
          ))}
          </Step>
        </div>
      </div>
      )}
    </div>
  );
} 
