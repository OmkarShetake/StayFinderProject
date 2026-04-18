package com.stayfinder.controller;

import com.stayfinder.dto.PropertyDTOs.*;
import com.stayfinder.entity.User;
import com.stayfinder.repository.PropertyAvailabilityRepository;
import com.stayfinder.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final PropertyAvailabilityRepository availabilityRepository;

    // ── Public endpoints ──────────────────────────────────────────
    @GetMapping("/properties/search")
    public ResponseEntity<Page<PropertyResponse>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String propertyType,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {

        PropertySearchParams params = new PropertySearchParams();
        params.setCity(city);
        params.setCheckIn(checkIn);
        params.setCheckOut(checkOut);
        params.setGuests(guests);
        params.setMinPrice(minPrice);
        params.setMaxPrice(maxPrice);
        params.setPropertyType(propertyType);
        params.setCategory(category);
        params.setPage(page);
        params.setSize(size);

        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(propertyService.search(params, userId));
    }

    @GetMapping("/properties/{id}")
    public ResponseEntity<PropertyResponse> getProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(propertyService.getById(id, userId));
    }

    @GetMapping("/properties/{id}/availability")
    public ResponseEntity<List<Map<String, Object>>> getAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        var avList = availabilityRepository.findByPropertyAndDateRange(id, from, to);
        var result = avList.stream().map(av -> Map.of(
                "date", av.getDate().toString(),
                "available", (Object) av.isAvailable(),
                "customPrice", av.getCustomPrice() != null ? av.getCustomPrice() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    // ── Guest authenticated endpoints ─────────────────────────────
    @PostMapping("/wishlists/{propertyId}")
    public ResponseEntity<Map<String, String>> toggleWishlist(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal User user) {
        propertyService.toggleWishlist(propertyId, user.getId());
        return ResponseEntity.ok(Map.of("message", "Wishlist updated"));
    }

    @GetMapping("/wishlists")
    public ResponseEntity<List<PropertyResponse>> getWishlist(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(propertyService.getWishlist(user.getId()));
    }

    // ── Host endpoints ────────────────────────────────────────────
    @PostMapping("/host/properties")
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(propertyService.createProperty(request, user.getId()));
    }

    @GetMapping("/host/properties")
    public ResponseEntity<Page<PropertyResponse>> getMyProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(propertyService.getMyProperties(user.getId(), page, size));
    }

    @PutMapping("/host/properties/{id}/availability")
    public ResponseEntity<Map<String, String>> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityUpdateRequest request,
            @AuthenticationPrincipal User user) {
        propertyService.updateAvailability(id, request, user.getId());
        return ResponseEntity.ok(Map.of("message", "Availability updated"));
    }

    // ── Admin endpoints ───────────────────────────────────────────
    @GetMapping("/admin/properties")
    public ResponseEntity<Page<PropertyResponse>> adminListProperties(
            @RequestParam(defaultValue = "PENDING") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(propertyService.getByStatus(
                com.stayfinder.entity.Property.PropertyStatus.valueOf(status), page, size));
    }

    @PatchMapping("/admin/properties/{id}/approve")
    public ResponseEntity<PropertyResponse> approveProperty(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.approveProperty(id));
    }

    @PatchMapping("/admin/properties/{id}/reject")
    public ResponseEntity<PropertyResponse> rejectProperty(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.rejectProperty(id));
    }

    @DeleteMapping("/admin/properties/{id}")
    public ResponseEntity<Map<String, String>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("message", "Property deleted successfully"));
    }
}