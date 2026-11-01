package com.stayfinder.config;

import com.stayfinder.kafka.NotificationEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka configuration — supports both local KRaft (no ZooKeeper) and Cloud Kafka (Confluent Cloud / Aiven SASL_SSL).
 *
 * Topic: stayfinder.notifications
 *   3 partitions  → 3 consumer threads run in parallel
 *   Key = userId  → events for same user land on same partition (ordered)
 *   1 replica     → single-node dev / cloud managed
 */
@Configuration
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {

    /** Centralised topic name — never hardcode elsewhere */
    public static final String TOPIC_NOTIFICATIONS = "stayfinder.notifications";

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${KAFKA_SASL_USERNAME:${spring.kafka.properties.sasl.username:}}")
    private String saslUsername;

    @Value("${KAFKA_SASL_PASSWORD:${spring.kafka.properties.sasl.password:}}")
    private String saslPassword;

    @Value("${spring.kafka.properties.security.protocol:}")
    private String securityProtocol;

    @Value("${spring.kafka.properties.sasl.mechanism:PLAIN}")
    private String saslMechanism;

    @Value("${spring.kafka.properties.sasl.jaas.config:}")
    private String saslJaasConfig;

    private void applySaslConfig(Map<String, Object> config) {
        if (saslUsername != null && !saslUsername.isBlank() && saslPassword != null && !saslPassword.isBlank()) {
            config.put("security.protocol", "SASL_SSL");
            String mechanism = (saslMechanism != null && !saslMechanism.isBlank()) ? saslMechanism.toUpperCase() : "PLAIN";
            config.put("sasl.mechanism", mechanism);
            config.put("ssl.endpoint.identification.algorithm", "https");

            String loginModule = mechanism.contains("SCRAM")
                ? "org.apache.kafka.common.security.scram.ScramLoginModule"
                : "org.apache.kafka.common.security.plain.PlainLoginModule";

            config.put("sasl.jaas.config", String.format(
                "%s required username=\"%s\" password=\"%s\";",
                loginModule, saslUsername.trim(), saslPassword.trim()
            ));
        } else if (securityProtocol != null && !securityProtocol.isBlank()) {
            config.put("security.protocol", securityProtocol);
            if (saslMechanism != null && !saslMechanism.isBlank()) {
                config.put("sasl.mechanism", saslMechanism);
            }
            if (saslJaasConfig != null && !saslJaasConfig.isBlank()) {
                config.put("sasl.jaas.config", saslJaasConfig);
            }
        }
    }

    /* ── Topic definition ─────────────────────────────────────────── */
    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name(TOPIC_NOTIFICATIONS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    /* ── Producer ─────────────────────────────────────────────────── */
    @Bean
    public ProducerFactory<String, NotificationEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,      bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,   StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG,                   "all");
        config.put(ProducerConfig.RETRIES_CONFIG,                3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG,     true);
        applySaslConfig(config);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, NotificationEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /* ── Consumer ─────────────────────────────────────────────────── */
    @Bean
    public ConsumerFactory<String, NotificationEvent> consumerFactory() {
        JsonDeserializer<NotificationEvent> deserializer =
                new JsonDeserializer<>(NotificationEvent.class, false);
        deserializer.addTrustedPackages("com.stayfinder.kafka");

        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,        bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG,                 "stayfinder-notification-group");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,   StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, deserializer);
        config.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG,          "read_committed");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,        "earliest");
        applySaslConfig(config);
        return new DefaultKafkaConsumerFactory<>(config, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>
    kafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(2000L, 3L)));
        return factory;
    }
}
