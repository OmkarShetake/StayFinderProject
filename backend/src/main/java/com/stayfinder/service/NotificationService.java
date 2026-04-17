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

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createAndSend(Long userId, String title, String message,
                              String type, Long referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .build();

        notificationRepository.save(notification);
        pushToUser(userId, notification);
        log.debug("Notification sent to user {}: {}", userId, title);
    }

    @Async
    public void pushToUser(Long userId, Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    Map.of(
                            "id", notification.getId(),
                            "title", notification.getTitle(),
                            "message", notification.getMessage(),
                            "type", notification.getType(),
                            "referenceId", notification.getReferenceId() != null
                                    ? notification.getReferenceId() : "",
                            "createdAt", notification.getCreatedAt().toString()
                    )
            );
        } catch (Exception e) {
            log.warn("Failed to push WS notification to user {}: {}", userId, e.getMessage());
        }
    }

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
