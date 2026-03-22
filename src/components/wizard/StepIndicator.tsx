interface StepIndicatorProps {
  currentStep: number;
}

const TOTAL_STEPS = 5;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      data-testid="step-indicator"
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i === currentStep
                ? "bg-primary-600 text-white"
                : "border border-gray-300 bg-white text-gray-600"
            }`}
          >
            {i + 1}
          </span>
          {i < TOTAL_STEPS - 1 && (
            <span
              className={`mx-1 h-0.5 w-6 ${
                i < currentStep ? "bg-primary-600" : "bg-gray-200"
              }`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
