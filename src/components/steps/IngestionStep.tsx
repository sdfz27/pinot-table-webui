import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIngestionStepSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";
import {
  createDefaultUpsertConfig,
  type BatchIngestionConfig,
  type DedupConfig,
  type StreamIngestionConfig,
  type UpsertConfig,
} from "../../types/pinotTable";

function upsertConfigForForm(existing?: UpsertConfig): UpsertConfig {
  const d = createDefaultUpsertConfig();
  if (!existing) return d;
  return {
    ...d,
    ...existing,
    comparisonColumns: existing.comparisonColumns ?? [],
  };
}

export function IngestionStep() {
  const {
    currentStep,
    tableType,
    columns,
    ingestionType,
    batchConfig,
    streamConfig,
    enableUpsert,
    upsertConfig,
    enableDedup,
    dedupConfig,
    updateIngestion,
    setStep,
  } = useWizardStore();

  const dimensionColumns = columns.filter((c) => c.fieldType === "DIMENSION");

  const ingestionSchema = createIngestionStepSchema(tableType);

  type IngestionFormData = z.infer<typeof ingestionSchema>;

  const canSelectBatch = tableType === "OFFLINE";
  const canSelectStream = tableType === "REALTIME";

  const defaultRealtime =
    tableType === "REALTIME"
      ? {
          enableUpsert: enableUpsert ?? false,
          upsertConfig: upsertConfigForForm(upsertConfig),
          enableDedup: enableDedup ?? false,
          dedupConfig: dedupConfig
            ? { hashFunction: dedupConfig.hashFunction }
            : { hashFunction: "NONE" as const },
        }
      : {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      ...defaultRealtime,
    },
  });

  const selectedIngestionType = watch("ingestionType");
  const watchedEnableUpsert = watch("enableUpsert");
  const watchedEnableDedup = watch("enableDedup");
  const watchedComparisonColumns = watch("upsertConfig.comparisonColumns");

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
    if (tableType === "REALTIME") {
      const d = data as IngestionFormData & {
        enableUpsert?: boolean;
        upsertConfig?: UpsertConfig;
        enableDedup?: boolean;
        dedupConfig?: { hashFunction: "NONE" | "MD5" | "MURMUR3" };
      };
      updates.enableUpsert = d.enableUpsert ?? false;
      if (d.enableUpsert && d.upsertConfig) {
        updates.upsertConfig = upsertConfigForForm({
          ...d.upsertConfig,
          comparisonColumns: d.upsertConfig.comparisonColumns ?? [],
        });
      } else {
        updates.upsertConfig = undefined;
      }
      updates.enableDedup = d.enableDedup ?? false;
      if (d.enableDedup && d.dedupConfig) {
        updates.dedupConfig = {
          hashFunction: d.dedupConfig.hashFunction,
        } as DedupConfig;
      } else {
        updates.dedupConfig = undefined;
      }
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
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Ingestion & Upsert</h2>
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

          {tableType === "REALTIME" && (
            <>
              <div className="rounded border border-gray-200 p-4 space-y-4">
                <h3 className="font-medium">Upsert</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("enableUpsert")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Upsert
                  </span>
                </label>
                {watchedEnableUpsert && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mode
                      </label>
                      <select
                        {...register("upsertConfig.mode")}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                      >
                        <option value="FULL">FULL</option>
                        <option value="PARTIAL">PARTIAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Upsert Key Columns
                      </label>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Emitted as <code className="text-xs">comparisonColumns</code>{" "}
                        in table JSON. If empty, Pinot uses the time column.
                      </p>
                      {dimensionColumns.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-500">
                          Add dimension columns in Schema step
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dimensionColumns.map((col) => (
                            <label
                              key={col.id}
                              className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  (watchedComparisonColumns ?? []).includes(
                                    col.name
                                  )
                                }
                                onChange={(e) => {
                                  const current =
                                    watchedComparisonColumns ?? [];
                                  if (e.target.checked) {
                                    setValue(
                                      "upsertConfig.comparisonColumns",
                                      [...current, col.name],
                                      { shouldValidate: true }
                                    );
                                  } else {
                                    setValue(
                                      "upsertConfig.comparisonColumns",
                                      current.filter((c) => c !== col.name),
                                      { shouldValidate: true }
                                    );
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              {col.name}
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.upsertConfig?.comparisonColumns?.message && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.upsertConfig.comparisonColumns.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-gray-100 pt-3">
                      <h4 className="text-sm font-medium text-gray-800">
                        Advanced (Pinot upsertConfig)
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            snapshot
                          </label>
                          <select
                            {...register("upsertConfig.snapshot")}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                          >
                            <option value="ENABLE">ENABLE</option>
                            <option value="DISABLE">DISABLE</option>
                            <option value="DEFAULT">DEFAULT</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            preload
                          </label>
                          <select
                            {...register("upsertConfig.preload")}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                          >
                            <option value="ENABLE">ENABLE</option>
                            <option value="DISABLE">DISABLE</option>
                            <option value="DEFAULT">DEFAULT</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register("upsertConfig.dropOutOfOrderRecord")}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          dropOutOfOrderRecord
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register(
                            "upsertConfig.enableDeletedKeysCompactionConsistency"
                          )}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          enableDeletedKeysCompactionConsistency
                        </span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          deletedKeysTTL
                        </label>
                        <input
                          type="number"
                          step="any"
                          {...register("upsertConfig.deletedKeysTTL", {
                            valueAsNumber: true,
                          })}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          consistencyMode
                        </label>
                        <select
                          {...register("upsertConfig.consistencyMode")}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                        >
                          <option value="NONE">NONE</option>
                          <option value="SYNC">SYNC</option>
                          <option value="SNAPSHOT">SNAPSHOT</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          NONE (default), SYNC, or SNAPSHOT — see Pinot upsert
                          docs.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          hashFunction
                        </label>
                        <select
                          {...register("upsertConfig.hashFunction")}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                        >
                          <option value="NONE">NONE</option>
                          <option value="MD5">MD5</option>
                          <option value="MURMUR3">MURMUR3</option>
                          <option value="UUID">UUID</option>
                          <option value="XXHASH">XXHASH</option>
                          <option value="XXH128">XXH128</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          defaultPartialUpsertStrategy
                        </label>
                        <select
                          {...register(
                            "upsertConfig.defaultPartialUpsertStrategy"
                          )}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                        >
                          <option value="APPEND">APPEND</option>
                          <option value="IGNORE">IGNORE</option>
                          <option value="INCREMENT">INCREMENT</option>
                          <option value="MAX">MAX</option>
                          <option value="MIN">MIN</option>
                          <option value="OVERWRITE">OVERWRITE</option>
                          <option value="FORCE_OVERWRITE">
                            FORCE_OVERWRITE
                          </option>
                          <option value="UNION">UNION</option>
                        </select>
                      </div>
                      <div className="space-y-2 rounded border border-dashed border-gray-200 p-3">
                        <p className="text-xs text-gray-500">
                          Deprecated Pinot fields (still emitted in JSON for
                          older brokers):
                        </p>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register("upsertConfig.enableSnapshot")}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            enableSnapshot
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register("upsertConfig.enablePreload")}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            enablePreload
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded border border-gray-200 p-4 space-y-4">
                <h3 className="font-medium">Dedup</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("enableDedup")}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Dedup
                  </span>
                </label>
                {watchedEnableDedup && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Hash Function
                    </label>
                    <select
                      {...register("dedupConfig.hashFunction")}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                    >
                      <option value="NONE">NONE</option>
                      <option value="MD5">MD5</option>
                      <option value="MURMUR3">MURMUR3</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}
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
