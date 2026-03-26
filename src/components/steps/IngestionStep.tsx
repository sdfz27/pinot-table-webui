import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIngestionStepSchema } from "../../utils/validation";
import {
  DEFAULT_KAFKA_JSON_DECODER,
  PINOT_KAFKA_DECODER_CLASSES,
} from "../../utils/kafkaStreamConfig";
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

function extraPropsToPairs(
  props?: Record<string, string>
): { key: string; value: string }[] {
  if (!props || Object.keys(props).length === 0) return [];
  return Object.entries(props).map(([key, value]) => ({ key, value }));
}

function streamConfigFormDefaults(
  sc?: StreamIngestionConfig
): {
  topicName: string;
  bootstrapServers: string;
  consumeType: "lowlevel" | "highlevel";
  autoOffsetReset: "smallest" | "largest";
  saslMechanism: string;
  securityProtocol: string;
  saslJaasConfig: string;
  decoderClassName: string;
  segmentFlushRows: string;
  segmentFlushSize: string;
  segmentFlushTime: string;
  segmentFlushInitialRows: string;
  consumerExtraPairs: { key: string; value: string }[];
} {
  return {
    topicName: sc?.topicName ?? "",
    bootstrapServers: sc?.bootstrapServers ?? "",
    consumeType: sc?.consumeType ?? "lowlevel",
    autoOffsetReset: sc?.autoOffsetReset ?? "smallest",
    saslMechanism: sc?.saslMechanism ?? "",
    securityProtocol: sc?.securityProtocol ?? "",
    saslJaasConfig: sc?.saslJaasConfig ?? "",
    decoderClassName: sc?.decoderClassName ?? DEFAULT_KAFKA_JSON_DECODER,
    segmentFlushRows: sc?.segmentFlushRows ?? "",
    segmentFlushSize: sc?.segmentFlushSize ?? "",
    segmentFlushTime: sc?.segmentFlushTime ?? "",
    segmentFlushInitialRows: sc?.segmentFlushInitialRows ?? "",
    consumerExtraPairs: extraPropsToPairs(sc?.consumerExtraProps),
  };
}

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
    control,
    formState: { errors },
  } = useForm<IngestionFormData>({
    resolver: zodResolver(ingestionSchema),
    defaultValues: {
      ingestionType,
      streamConfig: streamConfigFormDefaults(streamConfig),
      batchConfig: batchConfig || {
        segmentIngestionType: "APPEND",
        segmentIngestionFrequency: "DAILY",
      },
      ...defaultRealtime,
    },
  });

  const { fields: consumerExtraFields, append: appendConsumerExtra, remove: removeConsumerExtra } =
    useFieldArray({
      control,
      name: "streamConfig.consumerExtraPairs",
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
      const sc = data.streamConfig;
      const consumerExtraProps: Record<string, string> = {};
      for (const p of sc.consumerExtraPairs ?? []) {
        const k = p.key?.trim();
        if (k) consumerExtraProps[k] = p.value ?? "";
      }
      updates.streamConfig = {
        streamType: "kafka",
        topicName: sc.topicName!.trim(),
        bootstrapServers: sc.bootstrapServers!.trim(),
        consumeType: sc.consumeType ?? "lowlevel",
        autoOffsetReset: sc.autoOffsetReset ?? "smallest",
        saslMechanism: sc.saslMechanism?.trim() || undefined,
        securityProtocol: sc.securityProtocol?.trim() || undefined,
        saslJaasConfig: sc.saslJaasConfig?.trim() || undefined,
        decoderClassName:
          sc.decoderClassName?.trim() || DEFAULT_KAFKA_JSON_DECODER,
        segmentFlushRows: sc.segmentFlushRows?.trim() || undefined,
        segmentFlushSize: sc.segmentFlushSize?.trim() || undefined,
        segmentFlushTime: sc.segmentFlushTime?.trim() || undefined,
        segmentFlushInitialRows: sc.segmentFlushInitialRows?.trim() || undefined,
        consumerExtraProps:
          Object.keys(consumerExtraProps).length > 0
            ? consumerExtraProps
            : undefined,
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
                  Topic name
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  Emitted as <code className="text-xs">stream.kafka.topic.name</code>
                </p>
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
                  Broker list
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  Emitted as <code className="text-xs">stream.kafka.broker.list</code>
                </p>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Consumer level
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <code className="text-xs">stream.kafka.consume.type</code> — default lowlevel
                  </p>
                  <select
                    {...register("streamConfig.consumeType")}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  >
                    <option value="lowlevel">lowlevel</option>
                    <option value="highlevel">highlevel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auto offset reset
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <code className="text-xs">stream.kafka.consumer.prop.auto.offset.reset</code> — default smallest
                  </p>
                  <select
                    {...register("streamConfig.autoOffsetReset")}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  >
                    <option value="smallest">smallest</option>
                    <option value="largest">largest</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SASL mechanism
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Kafka <code className="text-xs">sasl.mechanism</code> (see Kafka / Pinot docs)
                  </p>
                  <input
                    type="text"
                    {...register("streamConfig.saslMechanism")}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g. PLAIN, SCRAM-SHA-256"
                    list="sasl-mechanism-suggestions"
                  />
                  <datalist id="sasl-mechanism-suggestions">
                    <option value="PLAIN" />
                    <option value="SCRAM-SHA-256" />
                    <option value="SCRAM-SHA-512" />
                    <option value="GSSAPI" />
                    <option value="OAUTHBEARER" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Security protocol
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Kafka <code className="text-xs">security.protocol</code>
                  </p>
                  <input
                    type="text"
                    {...register("streamConfig.securityProtocol")}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="e.g. SASL_SSL, PLAINTEXT"
                    list="security-protocol-suggestions"
                  />
                  <datalist id="security-protocol-suggestions">
                    <option value="PLAINTEXT" />
                    <option value="SSL" />
                    <option value="SASL_PLAINTEXT" />
                    <option value="SASL_SSL" />
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SASL JAAS config
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  Kafka <code className="text-xs">sasl.jaas.config</code> — paste the full JAAS line
                </p>
                <textarea
                  {...register("streamConfig.saslJaasConfig")}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder='e.g. org.apache.kafka.common.security.plain.PlainLoginModule required username="..." password="...";'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Decoder class name
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  <code className="text-xs">stream.kafka.decoder.class.name</code> — pick a built-in class or type a custom one
                </p>
                <input
                  type="text"
                  {...register("streamConfig.decoderClassName")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                  list="pinot-kafka-decoders"
                  placeholder={DEFAULT_KAFKA_JSON_DECODER}
                />
                <datalist id="pinot-kafka-decoders">
                  {PINOT_KAFKA_DECODER_CLASSES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="rounded border border-dashed border-gray-200 p-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-800">
                  Segment flush thresholds
                </h4>
                <p className="text-xs text-gray-500">
                  Optional. See Pinot real-time ingestion docs for{" "}
                  <code className="text-xs">realtime.segment.flush.threshold.*</code>.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">rows</label>
                    <input
                      type="text"
                      {...register("streamConfig.segmentFlushRows")}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">segment size</label>
                    <input
                      type="text"
                      {...register("streamConfig.segmentFlushSize")}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 200M"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">time</label>
                    <input
                      type="text"
                      {...register("streamConfig.segmentFlushTime")}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 12h"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">initial rows</label>
                    <input
                      type="text"
                      {...register("streamConfig.segmentFlushInitialRows")}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 100000"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded border border-dashed border-gray-200 p-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-800">
                  Additional Kafka consumer properties
                </h4>
                <p className="text-xs text-gray-500">
                  Keys are Kafka client property names (e.g. <code className="text-xs">max.poll.records</code>); each is emitted under{" "}
                  <code className="text-xs">stream.kafka.consumer.prop.&lt;key&gt;</code> unless you enter a full{" "}
                  <code className="text-xs">stream.*</code> key.
                </p>
                {consumerExtraFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">Property name</label>
                      <input
                        type="text"
                        {...register(`streamConfig.consumerExtraPairs.${index}.key` as const)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                        placeholder="e.g. max.poll.interval.ms"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">Value</label>
                      <input
                        type="text"
                        {...register(`streamConfig.consumerExtraPairs.${index}.value` as const)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConsumerExtra(index)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendConsumerExtra({ key: "", value: "" })}
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add consumer property
                </button>
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
