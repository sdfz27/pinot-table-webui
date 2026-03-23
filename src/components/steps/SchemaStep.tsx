import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { schemaStepSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { ColumnList } from "../schema/ColumnList";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";
import type { ColumnData } from "../../types/wizard";

type SchemaFormData = z.infer<typeof schemaStepSchema>;

export function SchemaStep() {
  const {
    currentStep,
    columns,
    primaryKeyColumns,
    enableColumnBasedNullHandling,
    updateColumns,
    updateIndexing,
    setStep,
  } = useWizardStore();

  const {
    watch,
    setValue,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SchemaFormData>({
    resolver: zodResolver(schemaStepSchema),
    defaultValues: {
      columns: columns.length > 0 ? columns : [],
      primaryKeyColumns: primaryKeyColumns?.length ? primaryKeyColumns : [],
      enableColumnBasedNullHandling: enableColumnBasedNullHandling ?? false,
    },
  });

  const formColumns = watch("columns");

  const onValid = (data: SchemaFormData) => {
    updateColumns(data.columns as ColumnData[]);
    updateIndexing({
      primaryKeyColumns: data.primaryKeyColumns ?? [],
      enableColumnBasedNullHandling: data.enableColumnBasedNullHandling ?? false,
    });
    setStep(currentStep + 1);
  };

  const handleColumnsChange = (newColumns: ColumnData[]) => {
    setValue("columns", newColumns as SchemaFormData["columns"], {
      shouldValidate: true,
    });
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
          <h2 className="mb-4 text-lg font-semibold">Schema Columns</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("enableColumnBasedNullHandling")}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable column-based null handling
              </span>
            </label>
            <ColumnList
              columns={(formColumns?.length ? formColumns : []) as ColumnData[]}
              onChange={handleColumnsChange}
            />
            {errors.columns && (
              <p className="text-sm text-red-600">{errors.columns.message}</p>
            )}
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-sm font-medium text-gray-700">
                Primary Key Columns
              </span>
              <div className="flex flex-wrap gap-3 rounded border border-gray-200 p-3">
                {((formColumns ?? []) as ColumnData[]).map((col) => {
                  const selected = (watch("primaryKeyColumns") ?? []).includes(col.name);
                  return (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const current = watch("primaryKeyColumns") ?? [];
                          const next = e.target.checked
                            ? [...current, col.name]
                            : current.filter((n) => n !== col.name);
                          setValue("primaryKeyColumns", next, { shouldValidate: true });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{col.name}</span>
                      <span className="text-xs text-gray-500">({col.fieldType})</span>
                    </label>
                  );
                })}
                {(formColumns ?? []).length === 0 && (
                  <p className="text-sm text-gray-500">Add columns above first</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Select columns that uniquely identify records. Used for upserts.
              </p>
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
