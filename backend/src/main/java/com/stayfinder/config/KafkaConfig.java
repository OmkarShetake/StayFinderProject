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
 * Kafka configuration — KRaft mode (no Zookeeper).
 *
 * Topic: stayfinder.notifications
 *   3 partitions  → 3 consumer threads run in parallel
 *   Key = userId  → events for same user land on same partition (ordered)
 *   1 replica     → single-node dev; raise to 3 in production
 */
@Configuration
public class KafkaConfig {

    /** Centralised topic name — never hardcode elsewhere */
    public static final String TOPIC_NOTIFICATIONS = "stayfinder.notifications";

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

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
        // Read only committed offsets — never process uncommitted messages
        config.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG,          "read_committed");
        // earliest: on first start, consume all existing messages from the beginning
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,        "earliest");
        return new DefaultKafkaConsumerFactory<>(config, new StringDeserializer(), deserializer);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>
    kafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, NotificationEvent>();
        factory.setConsumerFactory(consumerFactory());
        // 3 concurrent threads match the 3 topic partitions
        factory.setConcurrency(3);
        // Retry up to 3 times with 2s backoff before sending to Dead Letter Topic
        factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(2000L, 3L)));
        return factory;
    }
}
