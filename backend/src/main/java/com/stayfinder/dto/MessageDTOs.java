package com.stayfinder.dto;

import com.stayfinder.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

public class MessageDTOs {

    @Data
    public static class SendMessageRequest {
        @NotNull
        private Long bookingId;
        @NotBlank
        private String content;
    }

    @Data
    public static class MessageResponse {
        private Long id;
        private Long bookingId;
        private Long senderId;
        private String senderName;
        private Long receiverId;
        private String receiverName;
        private String content;
        private boolean read;
        private LocalDateTime createdAt;

        public static MessageResponse from(Message m) {
            MessageResponse r = new MessageResponse();
            r.id           = m.getId();
            r.bookingId    = m.getBooking().getId();
            r.senderId     = m.getSender().getId();
            r.senderName   = m.getSender().getFullName();
            r.receiverId   = m.getReceiver().getId();
            r.receiverName = m.getReceiver().getFullName();
            r.content      = m.getContent();
            r.read         = m.isRead();
            r.createdAt    = m.getCreatedAt();
            return r;
        }
    }
}
