import { WizardContainer } from "../components/wizard/WizardContainer";

export function WizardPage() {
  return (
    <div data-testid="wizard-root" className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <h1
          className="text-xl font-semibold text-gray-800 text-center"
          data-testid="app-header"
        >
          Pinot Table & Schema Generator
        </h1>
      </header>
      <main className="flex-1 px-4 py-6">
        <WizardContainer />
      </main>
    </div>
  );
}
