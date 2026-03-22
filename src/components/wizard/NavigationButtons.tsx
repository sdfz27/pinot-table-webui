interface NavigationButtonsProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

const TOTAL_STEPS = 5;
const buttonPrimary =
  "px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50";
const buttonSecondary =
  "px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50";

function getNextLabel(step: number): string {
  if (step === 3) return "Review";
  return "Next";
}

export function NavigationButtons({
  currentStep,
  onBack,
  onNext,
  isNextDisabled = false,
}: NavigationButtonsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const nextLabel = getNextLabel(currentStep);

  return (
    <div className="flex justify-between pt-4">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep}
        className={buttonSecondary}
      >
        Back
      </button>
      {!isLastStep && (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className={buttonPrimary}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
