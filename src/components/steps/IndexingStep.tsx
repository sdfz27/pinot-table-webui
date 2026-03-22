import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { indexingStepSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";

const indexingFormSchema = indexingStepSchema.extend({
  timeColumnName: z.string().optional(),
  retentionTimeUnit: z.enum(["HOURS", "DAYS", "MONTHS", "YEARS"]).optional().or(z.literal("")),
  retentionTimeValue: z.number().optional(),
  sortedColumn: z.string().optional(),
  loadMode: z.enum(["HEAP", "MMAP"]),
});

type IndexingFormData = z.infer<typeof indexingFormSchema>;

export function IndexingStep() {
  const {
    currentStep,
    columns,
    timeColumnName,
    replication,
    retentionTimeUnit,
    retentionTimeValue,
    sortedColumn,
    loadMode,
    updateIndexing,
    setStep,
  } = useWizardStore();

  const dateTimeColumns = columns.filter((c) => c.fieldType === "DATETIME");
  const allColumnNames = columns.map((c) => c.name).filter(Boolean);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IndexingFormData>({
    resolver: zodResolver(indexingFormSchema),
    defaultValues: {
      timeColumnName: timeColumnName || "",
      replication,
      retentionTimeUnit: retentionTimeUnit || "",
      retentionTimeValue: retentionTimeValue ?? 0,
      sortedColumn: sortedColumn || "",
      loadMode,
    },
  });

  const onValid = (data: IndexingFormData) => {
    updateIndexing({
      timeColumnName: data.timeColumnName || "",
      replication: data.replication,
      retentionTimeUnit: (data.retentionTimeUnit as "HOURS" | "DAYS" | "MONTHS" | "YEARS" | "") || "",
      retentionTimeValue: data.retentionTimeValue ?? 0,
      sortedColumn: data.sortedColumn || "",
      loadMode: data.loadMode,
    });
    setStep(currentStep + 1);
  };

  const handleNext = () => {
    handleSubmit(onValid)();
  };

  const handleBack = () => {
    setStep(currentStep - 1);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <StepIndicator currentStep={currentStep} />
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Indexing & Segments</h2>
          <div className="space-y-4">
          {dateTimeColumns.length > 0 && (
            <div>
              <label htmlFor="timeColumnName" className="block text-sm font-medium text-gray-700">
                Time Column Name
              </label>
              <select
                id="timeColumnName"
                {...register("timeColumnName")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">(None)</option>
                {dateTimeColumns.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="replication" className="block text-sm font-medium text-gray-700">
              Replication
            </label>
            <input
              id="replication"
              type="number"
              min={1}
              {...register("replication", { valueAsNumber: true })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.replication && (
              <p className="mt-1 text-sm text-red-600">{errors.replication.message}</p>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="retentionTimeValue" className="block text-sm font-medium text-gray-700">
                Retention Time Value
              </label>
              <input
                id="retentionTimeValue"
                type="number"
                min={0}
                {...register("retentionTimeValue", { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="retentionTimeUnit" className="block text-sm font-medium text-gray-700">
                Retention Time Unit
              </label>
              <select
                id="retentionTimeUnit"
                {...register("retentionTimeUnit")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">(None)</option>
                <option value="HOURS">HOURS</option>
                <option value="DAYS">DAYS</option>
                <option value="MONTHS">MONTHS</option>
                <option value="YEARS">YEARS</option>
              </select>
            </div>
          </div>
          {allColumnNames.length > 0 && (
            <div>
              <label htmlFor="sortedColumn" className="block text-sm font-medium text-gray-700">
                Sorted Column
              </label>
              <select
                id="sortedColumn"
                {...register("sortedColumn")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">(None)</option>
                {allColumnNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="loadMode" className="block text-sm font-medium text-gray-700">
              Load Mode
            </label>
            <select
              id="loadMode"
              {...register("loadMode")}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="HEAP">HEAP</option>
              <option value="MMAP">MMAP</option>
            </select>
          </div>
        </div>
        </div>
        <footer className="flex justify-between">
          <NavigationButtons
            currentStep={currentStep}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={false}
          />
        </footer>
      </div>
    </form>
  );
}
