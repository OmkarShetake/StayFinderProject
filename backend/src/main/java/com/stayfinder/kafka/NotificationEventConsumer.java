package com.stayfinder.kafka;

import com.stayfinder.service.EmailService;
import com.stayfinder.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import static com.stayfinder.config.KafkaConfig.TOPIC_NOTIFICATIONS;

/**
 * Consumes {@link NotificationEvent} messages from Kafka and:
 *   1. Saves in-app notification to DB + pushes via WebSocket
 *   2. Sends the appropriate HTML email
 *
 * Offset is committed automatically by Spring Kafka after this method
 * returns without throwing. On exception, DefaultErrorHandler retries
 * up to 3 times with 2s backoff before sending to DLT.
 */
@Component
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final NotificationService notificationService;
    private final EmailService        emailService;

    @KafkaListener(
        topics           = TOPIC_NOTIFICATIONS,
        groupId          = "stayfinder-notification-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            @Payload NotificationEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET)             long offset
    ) {
        log.info("Consuming Kafka event type={} userId={} partition={} offset={}",
                event.getType(), event.getUserId(), partition, offset);

        // 1. Persist in-app notification + push via WebSocket
        notificationService.createAndSendFromKafka(
                event.getUserId(),
                event.getTitle(),
                event.getMessage(),
                event.getType(),
                event.getReferenceId()
        );

        // 2. Send email (failure here is logged but does NOT prevent offset commit)
        dispatchEmail(event);

        log.info("Kafka event processed: type={} userId={}", event.getType(), event.getUserId());
    }

    /* ── Email routing ────────────────────────────────────────────── */
    private void dispatchEmail(NotificationEvent e) {
        try {
            switch (e.getType()) {

                case "BOOKING_CONFIRMED" -> {
                    if (e.getBookingReference() != null) {
                        emailService.sendBookingConfirmed(
                                e.getUserEmail(),
                                e.getUserFullName(),
                                e.getPropertyTitle()  != null ? e.getPropertyTitle()  : "",
                                e.getPropertyCity()   != null ? e.getPropertyCity()   : "",
                                e.getCheckIn()        != null ? e.getCheckIn()        : "",
                                e.getCheckOut()       != null ? e.getCheckOut()       : "",
                                e.getNights()         != null ? e.getNights()         : 0,
                                e.getGuests()         != null ? e.getGuests()         : 1,
                                e.getTotalAmount()    != null ? e.getTotalAmount()    : "",
                                e.getBookingReference()
                        );
                    } else {
                        emailService.send(e.getUserEmail(), e.getTitle(),
                                simpleHtml(e.getUserFullName(), e.getTitle(), e.getMessage()));
                    }
                }

                case "BOOKING_REQUEST" ->
                    emailService.send(e.getUserEmail(), e.getTitle(),
                            simpleHtml(e.getUserFullName(), e.getTitle(), e.getMessage()));

                case "BOOKING_CANCELLED" ->
                    emailService.sendBookingCancelled(
                            e.getUserEmail(),
                            e.getUserFullName(),
                            e.getPropertyTitle()    != null ? e.getPropertyTitle()    : "",
                            e.getBookingReference() != null ? e.getBookingReference() : ""
                    );

                case "BOOKING_MODIFIED" ->
                    emailService.sendBookingModified(
                            e.getUserEmail(),
                            e.getUserFullName(),
                            e.getPropertyTitle()    != null ? e.getPropertyTitle()    : "",
                            e.getCheckIn()          != null ? e.getCheckIn()          : "",
                            e.getCheckOut()         != null ? e.getCheckOut()         : "",
                            e.getTotalAmount()      != null ? e.getTotalAmount()      : "",
                            e.getBookingReference() != null ? e.getBookingReference() : ""
                    );

                case "BOOKING_REJECTED" ->
                    emailService.send(e.getUserEmail(), e.getTitle(),
                            simpleHtml(e.getUserFullName(), e.getTitle(), e.getMessage()));

                case "PROPERTY_APPROVED" ->
                    emailService.sendPropertyApproved(
                            e.getUserEmail(),
                            e.getUserFullName(),
                            e.getPropertyTitle() != null ? e.getPropertyTitle() : ""
                    );

                case "PROPERTY_REJECTED" ->
                    emailService.sendPropertyRejected(
                            e.getUserEmail(),
                            e.getUserFullName(),
                            e.getPropertyTitle() != null ? e.getPropertyTitle() : ""
                    );

                case "NEW_REVIEW" ->
                    emailService.sendNewReview(
                            e.getUserEmail(),
                            e.getUserFullName(),
                            e.getPropertyTitle() != null ? e.getPropertyTitle() : "",
                            e.getGuestName()     != null ? e.getGuestName()     : "",
                            e.getRating()        != null ? e.getRating()        : "5"
                    );

                default ->
                    emailService.send(e.getUserEmail(), e.getTitle(),
                            simpleHtml(e.getUserFullName(), e.getTitle(), e.getMessage()));
            }
        } catch (Exception ex) {
            // Email failure is logged but must NOT cause the Kafka offset to not commit
            log.error("Email dispatch failed for type={} user={}: {}",
                    e.getType(), e.getUserEmail(), ex.getMessage());
        }
    }

    private String simpleHtml(String name, String heading, String body) {
        return """
            <html><body style="font-family:sans-serif;padding:20px">
              <h2 style="color:#ff385c">%s</h2>
              <p>Hi %s,</p><p>%s</p>
              <hr><p style="color:#aaa;font-size:12px">© 2026 StayFinder</p>
            </body></html>
            """.formatted(heading, name, body);
    }
}
