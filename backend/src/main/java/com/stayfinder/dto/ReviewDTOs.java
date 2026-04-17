package com.stayfinder.dto;

import com.stayfinder.entity.Review;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReviewDTOs {

    @Data
    public static class CreateReviewRequest {
        @NotNull private Long bookingId;
        @Min(1) @Max(5) private int cleanliness;
        @Min(1) @Max(5) private int communication;
        @Min(1) @Max(5) private int checkin;
        @Min(1) @Max(5) private int location;
        @Min(1) @Max(5) private int value;
        @Min(1) @Max(5) private int accuracy;
        private String comment;
    }

    @Data
    public static class ReviewResponse {
        private Long id;
        private String guestName;
        private String guestAvatar;
        private int cleanliness;
        private int communication;
        private int checkin;
        private int location;
        private int value;
        private int accuracy;
        private BigDecimal overall;
        private String comment;
        private LocalDateTime createdAt;

        public static ReviewResponse from(Review r) {
            ReviewResponse res = new ReviewResponse();
            res.id = r.getId();
            res.guestName = r.getGuest().getFullName();
            res.guestAvatar = r.getGuest().getAvatarUrl();
            res.cleanliness = r.getCleanliness();
            res.communication = r.getCommunication();
            res.checkin = r.getCheckin();
            res.location = r.getLocation();
            res.value = r.getValue();
            res.accuracy = r.getAccuracy();
            res.overall = r.getOverall();
            res.comment = r.getComment();
            res.createdAt = r.getCreatedAt();
            return res;
        }
    }

    @Data
    public static class RatingSummary {
        private BigDecimal overall;
        private BigDecimal cleanliness;
        private BigDecimal communication;
        private BigDecimal checkin;
        private BigDecimal location;
        private BigDecimal value;
        private BigDecimal accuracy;
        private int totalReviews;
    }
}
