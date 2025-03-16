import { Step, StepContent, StepDesc, StepItem, StepNumber, StepTitle } from "./step-list";

export const Skeleton = () => (
  <div className="animate-pulse">
    <div className="px-8 mx-auto  max-w-screen-sm">
      <div className="mt-16 md:mt-16">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="mb-1">
            {step === 1 && (
              <Step>
                <StepItem status="init">
                  <StepNumber status="init" order={1} />
                  <StepTitle>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </StepTitle>
                  <StepDesc>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </StepDesc>
                  <StepContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </StepContent>
                </StepItem>
              </Step>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
); 