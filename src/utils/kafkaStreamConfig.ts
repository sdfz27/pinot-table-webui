import type { StreamIngestionConfig } from "../types/pinotTable";

/** Always emitted in `tableIndexConfig.streamConfigs`. */
export const KAFKA_CONSUMER_FACTORY_CLASS =
  "org.apache.pinot.plugin.stream.kafka20.KafkaConsumerFactory";

/** Default Pinot Kafka JSON decoder (see Pinot stream ingestion docs). */
export const DEFAULT_KAFKA_JSON_DECODER =
  "org.apache.pinot.plugin.stream.kafka.kafkaJSONMessageDecoder";

/** Built-in / common Pinot Kafka message decoder classes (custom class names allowed). */
export const PINOT_KAFKA_DECODER_CLASSES: readonly string[] = [
  DEFAULT_KAFKA_JSON_DECODER,
  "org.apache.pinot.plugin.inputformat.json.JSONMessageDecoder",
  "org.apache.pinot.plugin.inputformat.json.confluent.KafkaConfluentSchemaRegistryJsonMessageDecoder",
  "org.apache.pinot.plugin.inputformat.avro.KafkaAvroMessageDecoder",
  "org.apache.pinot.plugin.inputformat.avro.SimpleAvroMessageDecoder",
  "org.apache.pinot.plugin.inputformat.avro.confluent.KafkaConfluentSchemaRegistryAvroMessageDecoder",
  "org.apache.pinot.plugin.inputformat.csv.CSVMessageDecoder",
  "org.apache.pinot.plugin.inputformat.protobuf.ProtoBufMessageDecoder",
  "org.apache.pinot.plugin.inputformat.protobuf.KafkaConfluentSchemaRegistryProtoBufMessageDecoder",
];

/**
 * Builds the flat Pinot stream map for `tableIndexConfig.streamConfigs`
 * (`stream.kafka.*` keys, flush thresholds, etc.).
 */
export function buildKafkaStreamConfigMap(
  config: StreamIngestionConfig
): Record<string, string> {
  const decoder =
    config.decoderClassName?.trim() || DEFAULT_KAFKA_JSON_DECODER;

  const map: Record<string, string> = {
    streamType: "kafka",
    "stream.kafka.topic.name": config.topicName.trim(),
    "stream.kafka.broker.list": config.bootstrapServers.trim(),
    "stream.kafka.consumer.factory.class.name": KAFKA_CONSUMER_FACTORY_CLASS,
    "stream.kafka.consumer.type": config.consumeType ?? "lowlevel",
    "stream.kafka.consumer.prop.auto.offset.reset":
      config.autoOffsetReset ?? "smallest",
    "stream.kafka.decoder.class.name": decoder,
  };

  const setIf = (pinotKey: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) map[pinotKey] = v;
  };

  setIf("realtime.segment.flush.threshold.rows", config.segmentFlushRows);
  setIf("realtime.segment.flush.threshold.size", config.segmentFlushSize);
  setIf("realtime.segment.flush.threshold.time", config.segmentFlushTime);
  setIf(
    "realtime.segment.flush.threshold.autotune.initialRows",
    config.segmentFlushInitialRows
  );

  if (config.consumerExtraProps) {
    for (const [rawKey, rawVal] of Object.entries(config.consumerExtraProps)) {
      const key = rawKey.trim();
      const value = String(rawVal ?? "").trim();
      if (!key || !value) continue;
      map[key] = value;
    }
  }

  setIf("sasl.mechanism", config.saslMechanism);
  setIf("security.protocol", config.securityProtocol);
  setIf("sasl.jaas.config", config.saslJaasConfig);

  return map;
}
