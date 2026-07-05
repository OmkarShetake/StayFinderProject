package com.stayfinder.service;

import com.stayfinder.entity.Notification;
import com.stayfinder.entity.User;
import com.stayfinder.kafka.NotificationEvent;
import com.stayfinder.kafka.NotificationEventProducer;
import com.stayfinder.repository.NotificationRepository;
import com.stayfinder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository    notificationRepository;
    private final UserRepository            userRepository;
    private final SimpMessagingTemplate     messagingTemplate;
    private final NotificationEventProducer kafkaProducer;

    // ─────────────────────────────────────────────────────────────────
    // PRIMARY ENTRY POINT — called by BookingService, PropertyService,
    // ReviewService.  Publishes a Kafka event; the consumer handles DB
    // persistence + WebSocket push + email delivery asynchronously.
    // ─────────────────────────────────────────────────────────────────
    public void createAndSend(Long userId, String title, String message,
                              String type, Long referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("createAndSend called for unknown userId={}", userId);
            return;
        }

        NotificationEvent event = NotificationEvent.builder()
                .userId(userId)
                .userEmail(user.getEmail())
                .userFullName(user.getFullName())
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();

        kafkaProducer.publish(event);
        log.debug("Published Kafka notification event type={} userId={}", type, userId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Rich event variant — includes full booking details so the
    // consumer can render the rich HTML email template without an
    // extra DB round-trip.
    // ─────────────────────────────────────────────────────────────────
    public void createAndSendBookingEvent(Long userId, String title, String message,
                                          String type, Long referenceId,
                                          String propertyTitle, String propertyCity,
                                          String checkIn, String checkOut,
                                          Integer nights, Integer guests,
                                          String totalAmount, String bookingReference) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        NotificationEvent event = NotificationEvent.builder()
                .userId(userId)
                .userEmail(user.getEmail())
                .userFullName(user.getFullName())
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .propertyTitle(propertyTitle)
                .propertyCity(propertyCity)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .nights(nights)
                .guests(guests)
                .totalAmount(totalAmount)
                .bookingReference(bookingReference)
                .build();

        kafkaProducer.publish(event);
        log.debug("Published rich Kafka booking event type={} userId={}", type, userId);
    }

    // ─────────────────────────────────────────────────────────────────
    // CONSUMER ENTRY POINT — called ONLY by NotificationEventConsumer
    // after the event is consumed from Kafka.  Writes to DB and pushes
    // via WebSocket. Email is handled separately by the consumer.
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public void createAndSendFromKafka(Long userId, String title, String message,
                                       String type, Long referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("createAndSendFromKafka: userId={} not found", userId);
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();
        notificationRepository.save(notification);

        pushToUser(userId, notification);
        log.debug("Kafka consumer: persisted + pushed notification userId={} type={}", userId, type);
    }

    // ─────────────────────────────────────────────────────────────────
    // WebSocket push (fire-and-forget)
    // ─────────────────────────────────────────────────────────────────
    @Async
    public void pushToUser(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    Map.of(
                            "id",          notification.getId(),
                            "title",       notification.getTitle(),
                            "message",     notification.getMessage(),
                            "type",        notification.getType(),
                            "referenceId", notification.getReferenceId() != null
                                    ? notification.getReferenceId() : "",
                            "createdAt",   notification.getCreatedAt().toString()
                    )
            );
        } catch (Exception e) {
            log.warn("WebSocket push failed for userId={}: {}", userId, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Query methods
    // ─────────────────────────────────────────────────────────────────
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getAll(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }
}
