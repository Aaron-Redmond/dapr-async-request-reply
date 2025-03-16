"use client";

import { useEffect, useState } from "react";
import { Step, StepContent, StepDesc, StepItem, StepNumber, StepTitle } from "../step-list";
import { Skeleton } from "../skeleton";

interface StatusMessage {
  text: string;
  timestamp: string;
}

interface StatusUpdate {
  stage: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  messages: StatusMessage[];
  startedAt: string;
  completedAt?: string;
}

interface WorkflowStatus {
  runtimeStatus: string;
  createdAt: string;
  lastUpdatedAt: string;
  properties: {
    customStatus?: string;
    [key: string]: string | undefined;
  };
}

const resolveStepStatus = (workflowStatus: WorkflowStatus | null, index: number): 'done' | 'loading' | 'init' => {
  if (!workflowStatus) return 'init';
  
  if (workflowStatus.runtimeStatus === 'COMPLETED') {
    return 'done';
  }

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

export { resolveStepStatus };

interface WorkflowStatusProps {
  workflowId: string | null;
  isSubmitting: boolean;
}

export const WorkflowStatus = ({ workflowId, isSubmitting }: WorkflowStatusProps) => {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (workflowId) {
      setLoading(true);
      eventSource = new EventSource(`/api/workflow-status?workflowId=${workflowId}`);
      
      eventSource.onmessage = (event) => {
        setLoading(false);
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
        setLoading(false);
        eventSource?.close();
      };
    }

    return () => {
      eventSource?.close();
    };
  }, [workflowId]);

  if (isSubmitting && !workflowStatus) {
    return <Skeleton />;
  }

  if (!workflowId || statusUpdates.length === 0) {
    return null;
  }

  return (
    <div className="px-8 mx-auto max-w-screen-sm">
      <div className="mt-16 md:mt-16">
        <Step>
          {statusUpdates.map((update, index) => (
            <StepItem status={resolveStepStatus(workflowStatus, index)} key={index}>
              <StepNumber status={resolveStepStatus(workflowStatus, index)} order={index + 1} />
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
  );
}; 