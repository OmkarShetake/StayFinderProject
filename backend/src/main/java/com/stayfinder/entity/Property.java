package com.stayfinder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "properties")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "property_type", nullable = false)
    private String propertyType;

    @Column(nullable = false)
    private String category = "CITY";

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String country = "India";

    @Column(name = "zip_code")
    private String zipCode;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Column(name = "price_per_night", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "weekend_price", precision = 10, scale = 2)
    private BigDecimal weekendPrice;

    @Column(name = "cleaning_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal cleaningFee = BigDecimal.valueOf(800);

    @Column(name = "long_stay_discount", precision = 5, scale = 2)
    private BigDecimal longStayDiscount = BigDecimal.ZERO;

    @Column(name = "max_guests", nullable = false)
    private int maxGuests = 1;

    @Column(nullable = false)
    private int bedrooms = 1;

    @Column(nullable = false)
    private int bathrooms = 1;

    @Column(nullable = false)
    private int beds = 1;

    @Column(name = "instant_book", nullable = false)
    private boolean instantBook = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyStatus status = PropertyStatus.PENDING;

    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Column(name = "total_reviews")
    private int totalReviews = 0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_amenities", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "amenity")
    @Builder.Default
    private Set<String> amenities = new HashSet<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<PropertyImage> images = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum PropertyStatus { PENDING, APPROVED, REJECTED, INACTIVE }

    public enum PropertyType { ENTIRE_HOME, PRIVATE_ROOM, SHARED_ROOM }

    public enum Category { BEACH, MOUNTAIN, CITY, COUNTRYSIDE, LAKEFRONT, UNIQUE, HERITAGE, CAMPING }
}
