import { Suspense } from 'react';
import { AgentUI } from '../components/agent-ui';
import { WorkflowForm } from '../components/workflow-form';
import { Header } from '../components/header';

export default async function Page({
    params,
  }: {
    params: Promise<{ session: string }>
  }) {
    const { session } = await params
  return (
    <Suspense fallback={<div>Loading...</div>}>
       <Header />
      <WorkflowForm    />
    </Suspense>
  );
}