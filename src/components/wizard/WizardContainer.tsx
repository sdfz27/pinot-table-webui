import { useWizardStore } from "../../store/wizardStore";
import { BasicInfoStep } from "../steps/BasicInfoStep";
import { SchemaStep } from "../steps/SchemaStep";
import { IndexingStep } from "../steps/IndexingStep";
import { IngestionStep } from "../steps/IngestionStep";
import { ReviewStep } from "../steps/ReviewStep";

const TOTAL_STEPS = 5;

export function WizardContainer() {
  const currentStep = useWizardStore((s) => s.currentStep);

  if (currentStep < 0 || currentStep >= TOTAL_STEPS) {
    return null;
  }

  switch (currentStep) {
    case 0:
      return <BasicInfoStep />;
    case 1:
      return <SchemaStep />;
    case 2:
      return <IndexingStep />;
    case 3:
      return <IngestionStep />;
    case 4:
      return <ReviewStep />;
    default:
      return null;
  }
}
