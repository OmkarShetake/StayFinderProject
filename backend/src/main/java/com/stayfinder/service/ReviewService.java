package com.stayfinder.service;

import com.stayfinder.dto.ReviewDTOs.*;
import com.stayfinder.entity.*;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyService propertyService;
    private final NotificationService notificationService;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest req, Long guestId) {
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new StayFinderException("Booking not found"));

        if (!booking.getGuest().getId().equals(guestId)) {
            throw new StayFinderException("Unauthorized");
        }
        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new StayFinderException("Can only review completed bookings");
        }
        if (reviewRepository.existsByBookingId(req.getBookingId())) {
            throw new StayFinderException("Review already submitted for this booking");
        }

        BigDecimal overall = BigDecimal.valueOf(
                (req.getCleanliness() + req.getCommunication() + req.getCheckin() +
                        req.getLocation() + req.getValue() + req.getAccuracy()) / 6.0
        ).setScale(2, RoundingMode.HALF_UP);

        Review review = Review.builder()
                .booking(booking)
                .property(booking.getProperty())
                .guest(booking.getGuest())
                .cleanliness(req.getCleanliness())
                .communication(req.getCommunication())
                .checkin(req.getCheckin())
                .location(req.getLocation())
                .value(req.getValue())
                .accuracy(req.getAccuracy())
                .overall(overall)
                .comment(req.getComment())
                .build();

        reviewRepository.save(review);
        updatePropertyRating(booking.getProperty().getId());

        notificationService.createAndSend(booking.getProperty().getHost().getId(),
                "New review received ⭐",
                booking.getGuest().getFullName() + " left a " + overall + "-star review for " +
                        booking.getProperty().getTitle(),
                "NEW_REVIEW", review.getId());

        return ReviewResponse.from(review);
    }

    public Page<ReviewResponse> getPropertyReviews(Long propertyId, int page, int size) {
        return reviewRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId, PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    public RatingSummary getRatingSummary(Long propertyId) {
        // JPQL query returns Object[] directly with 6 avg values (one per column)
        Object[] avgs = reviewRepository.avgDetailedByPropertyId(propertyId);
        long count = reviewRepository.findByPropertyIdOrderByCreatedAtDesc(
                propertyId, PageRequest.of(0, 1)).getTotalElements();

        RatingSummary s = new RatingSummary();
        s.setTotalReviews((int) count);
        if (avgs != null && avgs.length == 6) {
            s.setCleanliness(toDouble(avgs[0]));
            s.setCommunication(toDouble(avgs[1]));
            s.setCheckin(toDouble(avgs[2]));
            s.setLocation(toDouble(avgs[3]));
            s.setValue(toDouble(avgs[4]));
            s.setAccuracy(toDouble(avgs[5]));
            // Calculate overall as average of all 6 ratings
            double sum = s.getCleanliness() + s.getCommunication() + s.getCheckin() +
                    s.getLocation() + s.getValue() + s.getAccuracy();
            s.setOverall(Math.round(sum / 6.0 * 100.0) / 100.0); // round to 2 decimals
        }
        return s;
    }

    private void updatePropertyRating(Long propertyId) {
        Double avg = reviewRepository.avgOverallByPropertyId(propertyId);
        long count = reviewRepository.findByPropertyIdOrderByCreatedAtDesc(
                propertyId, PageRequest.of(0, 1)).getTotalElements();
        if (avg != null) {
            propertyService.updatePropertyRating(propertyId,
                    BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP), (int) count);
        }
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        double d = ((Number) val).doubleValue();
        return Math.round(d * 100.0) / 100.0; // round to 2 decimal places
    }
}