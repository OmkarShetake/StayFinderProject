package com.stayfinder.controller;

import com.stayfinder.dto.BookingDTOs.*;
import com.stayfinder.entity.User;
import com.stayfinder.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── Guest ─────────────────────────────────────────────────────
    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, user.getId()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getId(), page, size));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getBookingById(id, user.getId()));
    }

    @PatchMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, user.getId()));
    }

    @PostMapping("/bookings/price-preview")
    public ResponseEntity<PricePreviewResponse> pricePreview(
            @Valid @RequestBody PricePreviewRequest request) {
        return ResponseEntity.ok(bookingService.previewPrice(request));
    }

    // ── Host ──────────────────────────────────────────────────────
    @GetMapping("/host/bookings")
    public ResponseEntity<Page<BookingResponse>> getHostBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getHostBookings(user.getId(), page, size));
    }

    @PatchMapping("/host/bookings/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.confirmBooking(id, user.getId()));
    }

    @PatchMapping("/host/bookings/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, user.getId()));
    }

    // ── Admin ─────────────────────────────────────────────────────
    @GetMapping("/admin/bookings")
    public ResponseEntity<Page<BookingResponse>> adminBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(page, size));
    }
}
