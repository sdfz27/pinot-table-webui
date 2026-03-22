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
  const { currentStep, columns, updateColumns, setStep } = useWizardStore();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<SchemaFormData>({
    resolver: zodResolver(schemaStepSchema),
    defaultValues: {
      columns: columns.length > 0 ? columns : [],
    },
  });

  const formColumns = watch("columns");

  const onValid = (data: SchemaFormData) => {
    updateColumns(data.columns as ColumnData[]);
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
      <div className="max-w-3xl mx-auto rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold">Schema Columns</h2>
        <div className="space-y-4">
          <ColumnList
            columns={(formColumns?.length ? formColumns : []) as ColumnData[]}
            onChange={handleColumnsChange}
          />
          {errors.columns && (
            <p className="text-sm text-red-600">{errors.columns.message}</p>
          )}
        </div>
        <NavigationButtons
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          isNextDisabled={false}
        />
      </div>
    </form>
  );
}
