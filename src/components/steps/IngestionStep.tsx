import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIngestionStepSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";
import type { BatchIngestionConfig, StreamIngestionConfig } from "../../types/pinotTable";

export function IngestionStep() {
  const {
    currentStep,
    tableType,
    ingestionType,
    batchConfig,
    streamConfig,
    updateIngestion,
    setStep,
  } = useWizardStore();

  const ingestionSchema = createIngestionStepSchema(tableType);

  type IngestionFormData = z.infer<typeof ingestionSchema>;

  const canSelectBatch = tableType === "OFFLINE";
  const canSelectStream = tableType === "REALTIME";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IngestionFormData>({
    resolver: zodResolver(ingestionSchema),
    defaultValues: {
      ingestionType,
      streamConfig: streamConfig
        ? {
            topicName: streamConfig.topicName || "",
            bootstrapServers: streamConfig.bootstrapServers || "",
          }
        : { topicName: "", bootstrapServers: "" },
      batchConfig: batchConfig || {
        segmentIngestionType: "APPEND",
        segmentIngestionFrequency: "DAILY",
      },
    },
  });

  const selectedIngestionType = watch("ingestionType");

  const onValid = (data: IngestionFormData) => {
    const updates: Parameters<typeof updateIngestion>[0] = {
      ingestionType: data.ingestionType,
    };
    if (data.ingestionType === "BATCH" && data.batchConfig) {
      const bc = data.batchConfig as Record<string, unknown>;
      updates.batchConfig = {
        segmentIngestionType: (bc.segmentIngestionType as BatchIngestionConfig["segmentIngestionType"]) ?? "APPEND",
        segmentIngestionFrequency: (bc.segmentIngestionFrequency as BatchIngestionConfig["segmentIngestionFrequency"]) ?? "DAILY",
      };
      updates.streamConfig = undefined;
    } else if (data.ingestionType === "STREAM" && data.streamConfig) {
      updates.streamConfig = {
        streamType: "kafka",
        topicName: data.streamConfig.topicName!.trim(),
        bootstrapServers: data.streamConfig.bootstrapServers!.trim(),
      } as StreamIngestionConfig;
      updates.batchConfig = undefined;
    } else {
      updates.batchConfig = undefined;
      updates.streamConfig = undefined;
    }
    updateIngestion(updates);
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
      <div className="max-w-3xl mx-auto rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold">Ingestion & Special</h2>
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700">Ingestion Type</span>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="NONE"
                  {...register("ingestionType")}
                  className="rounded border-gray-300"
                />
                <span>NONE</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="BATCH"
                  {...register("ingestionType")}
                  disabled={!canSelectBatch}
                  className="rounded border-gray-300"
                />
                <span>BATCH</span>
                {!canSelectBatch && (
                  <span className="text-xs text-gray-500">(OFFLINE only)</span>
                )}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="STREAM"
                  {...register("ingestionType")}
                  disabled={!canSelectStream}
                  className="rounded border-gray-300"
                />
                <span>STREAM</span>
                {!canSelectStream && (
                  <span className="text-xs text-gray-500">(REALTIME only)</span>
                )}
              </label>
            </div>
          </div>

          {selectedIngestionType === "BATCH" && canSelectBatch && (
            <div className="rounded border border-gray-200 p-4 space-y-4">
              <h3 className="font-medium">Batch Config</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Segment Ingestion Type
                </label>
                <select
                  {...register("batchConfig.segmentIngestionType")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="APPEND">APPEND</option>
                  <option value="REFRESH">REFRESH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Segment Ingestion Frequency
                </label>
                <select
                  {...register("batchConfig.segmentIngestionFrequency")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="HOURLY">HOURLY</option>
                  <option value="DAILY">DAILY</option>
                  <option value="WEEKLY">WEEKLY</option>
                  <option value="MONTHLY">MONTHLY</option>
                </select>
              </div>
            </div>
          )}

          {selectedIngestionType === "STREAM" && canSelectStream && (
            <div className="rounded border border-gray-200 p-4 space-y-4">
              <h3 className="font-medium">Stream Config (Kafka)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Topic Name
                </label>
                <input
                  type="text"
                  {...register("streamConfig.topicName")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="e.g. my-topic"
                />
                {errors.streamConfig?.topicName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.streamConfig.topicName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bootstrap Servers
                </label>
                <input
                  type="text"
                  {...register("streamConfig.bootstrapServers")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="broker1:9092,broker2:9092"
                />
                {errors.streamConfig?.bootstrapServers && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.streamConfig.bootstrapServers.message}
                  </p>
                )}
              </div>
            </div>
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
