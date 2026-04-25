package com.stayfinder.controller;

import com.stayfinder.dto.MessageDTOs.*;
import com.stayfinder.entity.User;
import com.stayfinder.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> send(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SendMessageRequest req) {
        return ResponseEntity.ok(messageService.sendMessage(user.getId(), req));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(messageService.getMessages(bookingId, user.getId()));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(user.getId())));
    }
}
