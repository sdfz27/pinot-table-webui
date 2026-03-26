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

function consumerPropKey(userKey: string): string {
  const k = userKey.trim();
  if (k.startsWith("stream.")) return k;
  return `stream.kafka.consumer.prop.${k}`;
}

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
    "stream.kafka.consume.type": config.consumeType ?? "lowlevel",
    "stream.kafka.consumer.prop.auto.offset.reset":
      config.autoOffsetReset ?? "smallest",
    "stream.kafka.decoder.class.name": decoder,
  };

  const setConsumerProp = (kafkaSuffix: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) {
      map[consumerPropKey(kafkaSuffix)] = v;
    }
  };

  const setIf = (pinotKey: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) map[pinotKey] = v;
  };

  setIf("realtime.segment.flush.threshold.rows", config.segmentFlushRows);
  setIf(
    "realtime.segment.flush.threshold.segment.size",
    config.segmentFlushSize
  );
  setIf("realtime.segment.flush.threshold.time", config.segmentFlushTime);
  setIf(
    "realtime.segment.flush.threshold.initial.rows",
    config.segmentFlushInitialRows
  );

  if (config.consumerExtraProps) {
    for (const [rawKey, rawVal] of Object.entries(config.consumerExtraProps)) {
      const key = rawKey.trim();
      const value = String(rawVal ?? "").trim();
      if (!key || !value) continue;
      map[consumerPropKey(key)] = value;
    }
  }

  setConsumerProp("sasl.mechanism", config.saslMechanism);
  setConsumerProp("security.protocol", config.securityProtocol);
  setConsumerProp("sasl.jaas.config", config.saslJaasConfig);

  return map;
}
