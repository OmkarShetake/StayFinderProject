package com.stayfinder.service;

import com.stayfinder.dto.MessageDTOs.*;
import com.stayfinder.entity.Booking;
import com.stayfinder.entity.Message;
import com.stayfinder.entity.User;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.BookingRepository;
import com.stayfinder.repository.MessageRepository;
import com.stayfinder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository   messageRepository;
    private final BookingRepository   bookingRepository;
    private final UserRepository      userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /* ── Send message ────────────────────────────────────────────── */
    @Transactional
    public MessageResponse sendMessage(Long senderId, SendMessageRequest req) {
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new StayFinderException("Booking not found"));

        // Determine receiver — if sender is guest, receiver is host and vice versa
        Long guestId = booking.getGuest().getId();
        Long hostId  = booking.getProperty().getHost().getId();

        if (!senderId.equals(guestId) && !senderId.equals(hostId)) {
            throw new StayFinderException("Unauthorized");
        }

        Long receiverId = senderId.equals(guestId) ? hostId : guestId;

        User sender   = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Message message = Message.builder()
                .booking(booking)
                .sender(sender)
                .receiver(receiver)
                .content(req.getContent().trim())
                .build();

        messageRepository.save(message);

        MessageResponse response = MessageResponse.from(message);

        // Push via WebSocket to receiver
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                "/queue/messages",
                Map.of(
                        "id",         message.getId(),
                        "bookingId",  booking.getId(),
                        "senderId",   senderId,
                        "senderName", sender.getFullName(),
                        "content",    message.getContent(),
                        "createdAt",  message.getCreatedAt().toString()
                )
        );

        log.debug("Message sent from {} to {} for booking {}", senderId, receiverId, booking.getId());
        return response;
    }

    /* ── Get messages for a booking ──────────────────────────────── */
    @Transactional
    public List<MessageResponse> getMessages(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));

        Long guestId = booking.getGuest().getId();
        Long hostId  = booking.getProperty().getHost().getId();

        if (!userId.equals(guestId) && !userId.equals(hostId)) {
            throw new StayFinderException("Unauthorized");
        }

        // Mark messages as read
        messageRepository.markReadByBookingAndReceiver(bookingId, userId);

        return messageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId)
                .stream().map(MessageResponse::from).collect(Collectors.toList());
    }

    /* ── Unread count ────────────────────────────────────────────── */
    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndReadFalse(userId);
    }
}
