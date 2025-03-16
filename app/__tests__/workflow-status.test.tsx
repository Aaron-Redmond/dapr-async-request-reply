import { describe, expect, test } from '@jest/globals';
import { resolveStepStatus } from '../components/workflow/workflow-status';
import { WorkflowStatus } from '../lib/model';

describe('resolveStepStatus', () => {
  test('returns "init" when workflowStatus is null', () => {
    expect(resolveStepStatus(null, 0)).toBe('init');
  });

  test('returns "done" when workflow is COMPLETED', () => {
    const workflowStatus: WorkflowStatus = {
      runtimeStatus: 'COMPLETED',
      createdAt: '2024-03-16T00:00:00Z',
      lastUpdatedAt: '2024-03-16T00:00:00Z',
      properties: {}
    };
    expect(resolveStepStatus(workflowStatus, 0)).toBe('done');
  });

  test('returns "loading" when stage status is running', () => {
    const workflowStatus: WorkflowStatus = {
      runtimeStatus: 'RUNNING',
      createdAt: '2024-03-16T00:00:00Z',
      lastUpdatedAt: '2024-03-16T00:00:00Z',
      properties: {
        'dapr.workflow.custom_status': JSON.stringify({
          updates: [{
            status: 'running'
          }]
        })
      }
    };
    expect(resolveStepStatus(workflowStatus, 0)).toBe('loading');
  });

  test('returns "init" when stage status is completed', () => {
    const workflowStatus: WorkflowStatus = {
      runtimeStatus: 'RUNNING',
      createdAt: '2024-03-16T00:00:00Z',
      lastUpdatedAt: '2024-03-16T00:00:00Z',
      properties: {
        'dapr.workflow.custom_status': JSON.stringify({
          updates: [{
            status: 'completed'
          }]
        })
      }
    };
    expect(resolveStepStatus(workflowStatus, 0)).toBe('init');
  });

  test('returns "init" when custom status cannot be parsed', () => {
    const workflowStatus: WorkflowStatus = {
      runtimeStatus: 'RUNNING',
      createdAt: '2024-03-16T00:00:00Z',
      lastUpdatedAt: '2024-03-16T00:00:00Z',
      properties: {
        'dapr.workflow.custom_status': 'invalid json'
      }
    };
    expect(resolveStepStatus(workflowStatus, 0)).toBe('init');
  });

  test('returns "init" when stage index does not exist', () => {
    const workflowStatus: WorkflowStatus = {
      runtimeStatus: 'RUNNING',
      createdAt: '2024-03-16T00:00:00Z',
      lastUpdatedAt: '2024-03-16T00:00:00Z',
      properties: {
        'dapr.workflow.custom_status': JSON.stringify({
          updates: []
        })
      }
    };
    expect(resolveStepStatus(workflowStatus, 0)).toBe('init');
  });
}); 