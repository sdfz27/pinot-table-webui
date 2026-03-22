import { WizardContainer } from "../components/wizard/WizardContainer";

export function WizardPage() {
  return (
    <div data-testid="wizard-root">
      <h1>Pinot Table & Schema Generator</h1>
      <WizardContainer />
    </div>
  );
}
