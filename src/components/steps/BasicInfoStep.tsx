import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { basicInfoSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export function BasicInfoStep() {
  const { currentStep, updateBasicInfo, setStep } = useWizardStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      tableName: useWizardStore.getState().tableName,
      tableType: useWizardStore.getState().tableType,
    },
  });

  const onValid = (data: BasicInfoFormData) => {
    updateBasicInfo(data);
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
          <h2 className="mb-4 text-lg font-semibold">Basic Info</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="tableName" className="block text-sm font-medium text-gray-700">
                Table Name
              </label>
              <input
                id="tableName"
                type="text"
                {...register("tableName")}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. my_table"
              />
              {errors.tableName && (
                <p className="mt-1 text-sm text-red-600">{errors.tableName.message}</p>
              )}
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700">Table Type</span>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="OFFLINE"
                    {...register("tableType")}
                    className="rounded border-gray-300"
                  />
                  <span>OFFLINE</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="REALTIME"
                    {...register("tableType")}
                    className="rounded border-gray-300"
                  />
                  <span>REALTIME</span>
                </label>
              </div>
              {errors.tableType && (
                <p className="mt-1 text-sm text-red-600">{errors.tableType.message}</p>
              )}
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
