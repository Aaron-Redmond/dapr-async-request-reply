"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface FormData {
  itemName: string;
  quantity: number;
  totalCost: number;
}

interface WorkflowFormProps {
  onWorkflowStart: (workflowId: string) => void;
  onSubmitStarted: () => void;
}

export const WorkflowForm = ({ onWorkflowStart, onSubmitStarted }: WorkflowFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    itemName: "",
    quantity: 1,
    totalCost: 0,
  });
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSubmitStarted();

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
      onWorkflowStart(workflowId);
      setLoading( false);
    } catch (error) {
     
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
    </div>
  );
}; 