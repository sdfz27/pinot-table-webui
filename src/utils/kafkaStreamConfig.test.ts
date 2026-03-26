import { describe, it, expect } from "vitest";
import type { StreamIngestionConfig } from "../types/pinotTable";
import {
  buildKafkaStreamConfigMap,
  DEFAULT_KAFKA_JSON_DECODER,
  KAFKA_CONSUMER_FACTORY_CLASS,
} from "./kafkaStreamConfig";

const base: StreamIngestionConfig = {
  streamType: "kafka",
  topicName: "events",
  bootstrapServers: "b1:9092",
};

describe("buildKafkaStreamConfigMap", () => {
  it("includes required Pinot keys and defaults", () => {
    const m = buildKafkaStreamConfigMap(base);
    expect(m).toEqual({
      streamType: "kafka",
      "stream.kafka.topic.name": "events",
      "stream.kafka.broker.list": "b1:9092",
      "stream.kafka.consumer.factory.class.name": KAFKA_CONSUMER_FACTORY_CLASS,
      "stream.kafka.consume.type": "lowlevel",
      "stream.kafka.consumer.prop.auto.offset.reset": "smallest",
      "stream.kafka.decoder.class.name": DEFAULT_KAFKA_JSON_DECODER,
    });
  });

  it("respects consume type and offset reset", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      consumeType: "highlevel",
      autoOffsetReset: "largest",
    });
    expect(m["stream.kafka.consume.type"]).toBe("highlevel");
    expect(m["stream.kafka.consumer.prop.auto.offset.reset"]).toBe("largest");
  });

  it("emits SASL and security props when set", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      saslMechanism: "SCRAM-SHA-256",
      securityProtocol: "SASL_SSL",
      saslJaasConfig: "org.apache.kafka.common.security.scram.ScramLoginModule required;",
    });
    expect(m["stream.kafka.consumer.prop.sasl.mechanism"]).toBe("SCRAM-SHA-256");
    expect(m["stream.kafka.consumer.prop.security.protocol"]).toBe("SASL_SSL");
    expect(m["stream.kafka.consumer.prop.sasl.jaas.config"]).toContain("ScramLoginModule");
  });

  it("prefixes consumer extra props with stream.kafka.consumer.prop", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      consumerExtraProps: { "max.poll.records": "500" },
    });
    expect(m["stream.kafka.consumer.prop.max.poll.records"]).toBe("500");
  });

  it("passes through full stream.* keys in consumer extra without extra prefix", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      consumerExtraProps: { "stream.kafka.decoder.prop.x": "y" },
    });
    expect(m["stream.kafka.decoder.prop.x"]).toBe("y");
  });

  it("lets dedicated SASL fields override consumer extra for the same property", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      consumerExtraProps: { "sasl.mechanism": "PLAIN" },
      saslMechanism: "SCRAM-SHA-256",
    });
    expect(m["stream.kafka.consumer.prop.sasl.mechanism"]).toBe("SCRAM-SHA-256");
  });

  it("emits segment flush keys when provided", () => {
    const m = buildKafkaStreamConfigMap({
      ...base,
      segmentFlushRows: "100",
      segmentFlushSize: "150M",
      segmentFlushTime: "24h",
      segmentFlushInitialRows: "50",
    });
    expect(m["realtime.segment.flush.threshold.rows"]).toBe("100");
    expect(m["realtime.segment.flush.threshold.segment.size"]).toBe("150M");
    expect(m["realtime.segment.flush.threshold.time"]).toBe("24h");
    expect(m["realtime.segment.flush.threshold.initial.rows"]).toBe("50");
  });
});
