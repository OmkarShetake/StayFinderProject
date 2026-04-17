package com.stayfinder.controller;

import com.stayfinder.dto.ReviewDTOs.*;
import com.stayfinder.entity.User;
import com.stayfinder.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(request, user.getId()));
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<Page<ReviewResponse>> getPropertyReviews(
            @PathVariable Long propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getPropertyReviews(propertyId, page, size));
    }

    @GetMapping("/property/{propertyId}/summary")
    public ResponseEntity<RatingSummary> getRatingSummary(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(propertyId));
    }
}
