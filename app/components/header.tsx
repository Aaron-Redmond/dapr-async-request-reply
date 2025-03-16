import { IconBrandGithub } from "@tabler/icons-react";
import { WorkflowIcon } from "../icons/workflow-icon";
import DeployButton from "./deploy-button";

export const Header = () => {
    return (
      <header className="bg-purple-50  text-center">
        <div className="mx-auto max-w-screen-sm px-8 py-12">
          <h1 className="text-3xl font-bold">Dapr Workflow Demo</h1>
  
          <div className="mt-2 text-lg opacity-60">
            This is a simple example to demonstrate Asynchronous Request-Reply pattern with Dapr workflow.
          </div>
  
          <div className="flex justify-center items-center gap-6 mt-4">
            <a
              className="inline-flex items-center gap-0.5 font-medium underline"
              href="https://github.com/Aaron-Redmond/dapr-async-request-reply"
              target="_blank"
            >
              <IconBrandGithub size={18} />
              Repository
            </a>
            <div className="h-8 w-[103px]">
              <DeployButton />
            </div>
          </div>
        </div>
      </header>
    );
}