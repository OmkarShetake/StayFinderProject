package com.stayfinder.service;

import com.stayfinder.entity.Notification;
import com.stayfinder.entity.User;
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

    private final NotificationRepository  notificationRepository;
    private final UserRepository          userRepository;
    private final SimpMessagingTemplate   messagingTemplate;
    private final EmailService            emailService;

    /* ── Create in-app notification + send email ─────────────────── */
    @Transactional
    public void createAndSend(Long userId, String title, String message,
                              String type, Long referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        // Save in-app notification
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();
        notificationRepository.save(notification);

        // Push via WebSocket
        pushToUser(userId, notification);

        // Send email based on notification type
        sendEmailForType(user, type, title, message);

        log.debug("Notification sent to user {}: {}", userId, title);
    }

    /* ── Route to correct email template by notification type ────── */
    private void sendEmailForType(User user, String type, String title, String message) {
        try {
            switch (type) {

                case "BOOKING_CONFIRMED" ->
                    // Simple confirmation — full details sent separately by BookingService
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                case "BOOKING_CANCELLED" ->
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                case "BOOKING_MODIFIED" ->
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                case "BOOKING_REQUEST" ->
                    // Host gets notified of new booking request
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                case "BOOKING_REJECTED" ->
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                case "PROPERTY_APPROVED" ->
                        emailService.sendPropertyApproved(
                                user.getEmail(),
                                user.getFullName(),
                                // Extract property title from message
                                message.contains("'") ? message.split("'")[1] : message
                        );

                case "PROPERTY_REJECTED" ->
                        emailService.sendPropertyRejected(
                                user.getEmail(),
                                user.getFullName(),
                                message.contains("'") ? message.split("'")[1] : message
                        );

                case "NEW_REVIEW" ->
                        emailService.send(
                                user.getEmail(),
                                title,
                                simpleEmail(user.getFullName(), title, message)
                        );

                default ->
                        log.debug("No email template for notification type: {}", type);
            }
        } catch (Exception e) {
            // Never let email failure break the main notification flow
            log.error("Email send failed for user {} type {}: {}", user.getId(), type, e.getMessage());
        }
    }

    /* ── Simple plain email wrapper ──────────────────────────────── */
    private String simpleEmail(String recipientName, String heading, String bodyText) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f7f7f7;
                         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0"
                     style="background:#f7f7f7;padding:40px 0">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:12px;
                                overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr>
                      <td style="background:#ff385c;padding:28px 40px">
                        <span style="color:white;font-size:22px;font-weight:700;
                                     letter-spacing:-0.5px">stayfinder</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px">
                        <h2 style="margin:0 0 8px;font-size:22px;color:#222">%s</h2>
                        <p style="margin:0 0 20px;color:#717171;font-size:15px">Hi %s,</p>
                        <p style="color:#222;font-size:15px;line-height:1.6">%s</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f7f7f7;padding:20px 40px;border-top:1px solid #eee">
                        <p style="margin:0;font-size:12px;color:#aaa;text-align:center">
                          © 2026 StayFinder
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(heading, recipientName, bodyText);
    }

    /* ── WebSocket push ──────────────────────────────────────────── */
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
            log.warn("Failed to push WS notification to user {}: {}", userId, e.getMessage());
        }
    }

    /* ── Queries ─────────────────────────────────────────────────── */
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