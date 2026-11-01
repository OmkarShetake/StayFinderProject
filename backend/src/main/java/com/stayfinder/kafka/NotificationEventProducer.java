package com.stayfinder.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

import static com.stayfinder.config.KafkaConfig.TOPIC_NOTIFICATIONS;

/**
 * Publishes {@link NotificationEvent} messages to the Kafka topic.
 *
 * The message key is the userId (as String), which ensures all events
 * for the same user land on the same partition — preserving order.
 */
@Component
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class NotificationEventProducer {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    public void publish(NotificationEvent event) {
        String messageKey = String.valueOf(event.getUserId());

        CompletableFuture<SendResult<String, NotificationEvent>> future =
                kafkaTemplate.send(TOPIC_NOTIFICATIONS, messageKey, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                // Log the failure — NotificationService fallback will handle direct delivery
                log.error("Failed to publish Kafka event type={} userId={}: {}",
                        event.getType(), event.getUserId(), ex.getMessage());
            } else {
                log.debug("Published Kafka event type={} userId={} partition={} offset={}",
                        event.getType(),
                        event.getUserId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
