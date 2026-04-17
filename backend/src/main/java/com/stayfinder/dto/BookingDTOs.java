package com.stayfinder.dto;

import com.stayfinder.entity.Booking;
import com.stayfinder.entity.Review;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookingDTOs {

    @Data
    public static class CreateBookingRequest {
        @NotNull private Long propertyId;
        @NotNull private LocalDate checkIn;
        @NotNull private LocalDate checkOut;
        @Min(1) private int guests = 1;
        private String message;
    }

    @Data
    public static class BookingResponse {
        private Long id;
        private String referenceId;
        private PropertySummary property;
        private GuestSummary guest;
        private LocalDate checkIn;
        private LocalDate checkOut;
        private int guests;
        private int nights;
        private BigDecimal baseAmount;
        private BigDecimal cleaningFee;
        private BigDecimal serviceFee;
        private BigDecimal totalAmount;
        private String status;
        private String bookingType;
        private String message;
        private LocalDateTime createdAt;
        private boolean canReview;

        public static BookingResponse from(Booking b) {
            return from(b, false);
        }

        public static BookingResponse from(Booking b, boolean canReview) {
            BookingResponse r = new BookingResponse();
            r.id = b.getId();
            r.referenceId = b.getReferenceId();
            r.property = PropertySummary.from(b.getProperty());
            r.guest = GuestSummary.from(b.getGuest());
            r.checkIn = b.getCheckIn();
            r.checkOut = b.getCheckOut();
            r.guests = b.getGuests();
            r.nights = b.getNights();
            r.baseAmount = b.getBaseAmount();
            r.cleaningFee = b.getCleaningFee();
            r.serviceFee = b.getServiceFee();
            r.totalAmount = b.getTotalAmount();
            r.status = b.getStatus().name();
            r.bookingType = b.getBookingType();
            r.message = b.getMessage();
            r.createdAt = b.getCreatedAt();
            r.canReview = canReview;
            return r;
        }
    }

    @Data
    public static class PropertySummary {
        private Long id;
        private String title;
        private String city;
        private String primaryImage;
        private BigDecimal pricePerNight;

        public static PropertySummary from(com.stayfinder.entity.Property p) {
            PropertySummary s = new PropertySummary();
            s.id = p.getId();
            s.title = p.getTitle();
            s.city = p.getCity();
            s.primaryImage = p.getImages().stream()
                    .filter(com.stayfinder.entity.PropertyImage::isPrimary)
                    .map(com.stayfinder.entity.PropertyImage::getImageUrl)
                    .findFirst().orElse(null);
            s.pricePerNight = p.getPricePerNight();
            return s;
        }
    }

    @Data
    public static class GuestSummary {
        private Long id;
        private String fullName;
        private String avatarUrl;

        public static GuestSummary from(com.stayfinder.entity.User u) {
            GuestSummary g = new GuestSummary();
            g.id = u.getId();
            g.fullName = u.getFullName();
            g.avatarUrl = u.getAvatarUrl();
            return g;
        }
    }

    @Data
    public static class PricePreviewRequest {
        @NotNull private Long propertyId;
        @NotNull private String checkIn;
        @NotNull private String checkOut;
        @Min(1) private int guests = 1;
    }

    @Data
    public static class PricePreviewResponse {
        private int nights;
        private BigDecimal pricePerNight;
        private BigDecimal baseAmount;
        private BigDecimal cleaningFee;
        private BigDecimal serviceFee;
        private BigDecimal totalAmount;
        private BigDecimal longStayDiscount;
    }
}
