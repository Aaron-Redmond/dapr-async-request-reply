"use client";

import { useState } from "react";
import { WorkflowForm } from "./workflow-form";
import { WorkflowStatus } from "./workflow-status";

export const Workflow = () => {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWorkflowStart = (workflowId: string) => {
    setCurrentWorkflowId(workflowId);
  };

  const handleSubmitStarted = () => {
    setIsSubmitting(true);
  };

  return (
    <div>
      <WorkflowForm 
        onWorkflowStart={handleWorkflowStart} 
        onSubmitStarted={handleSubmitStarted} 
      />
      <WorkflowStatus 
        workflowId={currentWorkflowId} 
        isSubmitting={isSubmitting}
      />
    </div>
  );
}; 