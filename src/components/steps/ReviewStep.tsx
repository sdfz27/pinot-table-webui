import { useWizardStore } from "../../store/wizardStore";
import { generateSchema } from "../../utils/generateSchema";
import { generateTable } from "../../utils/generateTable";
import { JsonPreview } from "../common/JsonPreview";
import { CopyDownload } from "../common/CopyDownload";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";

export function ReviewStep() {
  const { currentStep, tableName, reset, setStep } = useWizardStore();

  const schemaJson = generateSchema(useWizardStore.getState());
  const tableJson = generateTable(useWizardStore.getState());

  const handleBack = () => {
    setStep(currentStep - 1);
  };

  const handleStartOver = () => {
    reset();
  };

  return (
    <div className="space-y-4">
      <StepIndicator currentStep={currentStep} />
      <div className="max-w-3xl mx-auto min-w-0 space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Review & Export</h2>
          <div className="space-y-6">
            <div>
              <CopyDownload
                data={schemaJson}
                tableName={tableName || "schema"}
                variant="schema"
                label="Schema JSON"
              />
              <div className="mt-2 min-w-0 max-w-full overflow-hidden rounded border border-gray-200 p-3">
                <JsonPreview obj={schemaJson} />
              </div>
            </div>
            <div>
              <CopyDownload
                data={tableJson}
                tableName={tableName || "table"}
                variant="table"
                label="Table JSON"
              />
              <div className="mt-2 min-w-0 max-w-full overflow-hidden rounded border border-gray-200 p-3">
                <JsonPreview obj={tableJson} />
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-between items-center pt-4">
          <NavigationButtons
            currentStep={currentStep}
            onBack={handleBack}
            onNext={() => {}}
            isNextDisabled={true}
          />
          <button
            type="button"
            onClick={handleStartOver}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Start Over
          </button>
        </footer>
      </div>
    </div>
  );
}
