package com.stayfinder.dto;

import com.stayfinder.entity.Property;
import com.stayfinder.entity.PropertyImage;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class PropertyDTOs {

    @Data
    public static class CreatePropertyRequest {
        @NotBlank @Size(min = 5, max = 100) private String title;
        @Size(max = 2000) private String description;
        @NotBlank private String propertyType;
        private String category = "CITY";
        @NotBlank private String address;
        @NotBlank private String city;
        @NotBlank private String state;
        private String country = "India";
        private String zipCode;
        private BigDecimal latitude;
        private BigDecimal longitude;
        @NotNull @DecimalMin("100") @DecimalMax("1000000") private BigDecimal pricePerNight;
        @DecimalMin("0") private BigDecimal weekendPrice;
        @DecimalMin("0") private BigDecimal cleaningFee = BigDecimal.valueOf(800);
        @DecimalMin("0") @DecimalMax("50") private BigDecimal longStayDiscount = BigDecimal.ZERO;
        @Min(1) @Max(16) private int maxGuests = 1;
        @Min(1) @Max(20) private int bedrooms = 1;
        @Min(1) @Max(20) private int bathrooms = 1;
        @Min(1) @Max(30) private int beds = 1;
        private boolean instantBook = true;
        private Set<String> amenities;
        @NotNull @Size(min = 1, max = 5, message = "At least 1 and at most 5 images required")
        private List<String> imageUrls;
    }

    @Data
    public static class PropertyResponse {
        private Long id;
        private HostInfo host;
        private String title;
        private String description;
        private String propertyType;
        private String category;
        private String address;
        private String city;
        private String state;
        private String country;
        private BigDecimal pricePerNight;
        private BigDecimal weekendPrice;
        private BigDecimal cleaningFee;
        private BigDecimal longStayDiscount;
        private int maxGuests;
        private int bedrooms;
        private int bathrooms;
        private int beds;
        private boolean instantBook;
        private String status;
        private BigDecimal avgRating;
        private int totalReviews;
        private Set<String> amenities;
        private List<String> images;
        private boolean wishlisted;
        private LocalDateTime createdAt;
        private BigDecimal latitude;
        private BigDecimal longitude;

        public static PropertyResponse from(Property p) {
            return from(p, false);
        }

        public static PropertyResponse from(Property p, boolean wishlisted) {
            PropertyResponse r = new PropertyResponse();
            r.id = p.getId();
            r.host = HostInfo.from(p.getHost());
            r.title = p.getTitle();
            r.description = p.getDescription();
            r.propertyType = p.getPropertyType();
            r.category = p.getCategory();
            r.address = p.getAddress();
            r.city = p.getCity();
            r.state = p.getState();
            r.country = p.getCountry();
            r.pricePerNight = p.getPricePerNight();
            r.weekendPrice = p.getWeekendPrice();
            r.cleaningFee = p.getCleaningFee();
            r.longStayDiscount = p.getLongStayDiscount();
            r.maxGuests = p.getMaxGuests();
            r.bedrooms = p.getBedrooms();
            r.bathrooms = p.getBathrooms();
            r.beds = p.getBeds();
            r.instantBook = p.isInstantBook();
            r.status = p.getStatus().name();
            r.avgRating = p.getAvgRating();
            r.totalReviews = p.getTotalReviews();
            r.amenities = p.getAmenities();
            r.images = p.getImages().stream()
                    .map(PropertyImage::getImageUrl)
                    .collect(Collectors.toList());
            r.wishlisted = wishlisted;
            r.createdAt = p.getCreatedAt();
            r.latitude = p.getLatitude();
            r.longitude = p.getLongitude();
            return r;
        }
    }

    @Data
    public static class HostInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private boolean superhost;
        private BigDecimal avgRating;

        public static HostInfo from(com.stayfinder.entity.User u) {
            HostInfo h = new HostInfo();
            h.id = u.getId();
            h.fullName = u.getFullName();
            h.avatarUrl = u.getAvatarUrl();
            h.superhost = u.isSuperhost();
            return h;
        }
    }

    @Data
    public static class PropertySearchParams {
        private String city;
        private String checkIn;
        private String checkOut;
        private Integer guests;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private String propertyType;
        private String category;
        private int page = 0;
        private int size = 20;
        private String sortBy = "rating";
    }

    @Data
    public static class AvailabilityUpdateRequest {
        @NotNull private String date;
        @NotNull private boolean available;
        private BigDecimal customPrice;
    }
}
