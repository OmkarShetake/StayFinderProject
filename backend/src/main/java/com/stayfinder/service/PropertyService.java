package com.stayfinder.service;

import com.stayfinder.dto.PropertyDTOs.*;
import com.stayfinder.entity.*;
import com.stayfinder.entity.Property.PropertyStatus;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.*;
import com.stayfinder.kafka.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyAvailabilityRepository availabilityRepository;
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final GeminiAIService geminiAIService;

    @Transactional
    public PropertyResponse createProperty(CreatePropertyRequest req, Long hostId) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new StayFinderException("Host not found"));
        if (!host.isHost()) {
            throw new StayFinderException("User is not registered as a host. Please become a host first.");
        }
        Property property = Property.builder()
                .host(host)
                .title(req.getTitle())
                .description(req.getDescription())
                .propertyType(req.getPropertyType())
                .category(req.getCategory())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .country(req.getCountry())
                .zipCode(req.getZipCode())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .pricePerNight(req.getPricePerNight())
                .weekendPrice(req.getWeekendPrice())
                .cleaningFee(req.getCleaningFee())
                .longStayDiscount(req.getLongStayDiscount())
                .maxGuests(req.getMaxGuests())
                .bedrooms(req.getBedrooms())
                .bathrooms(req.getBathrooms())
                .beds(req.getBeds())
                .instantBook(req.isInstantBook())
                .status(PropertyStatus.PENDING)
                .build();
        if (req.getAmenities() != null) {
            property.setAmenities(req.getAmenities());
        }
        if (req.getImageUrls() != null) {
            List<PropertyImage> images = req.getImageUrls().stream()
                    .map(url -> PropertyImage.builder()
                            .property(property)
                            .imageUrl(url)
                            .primary(req.getImageUrls().indexOf(url) == 0)
                            .sortOrder(req.getImageUrls().indexOf(url))
                            .build())
                    .collect(Collectors.toList());
            property.setImages(images);
        }
        propertyRepository.save(property);
        log.info("New property created: {} by host: {}", property.getTitle(), host.getEmail());
        return PropertyResponse.from(property);
    }

    public Page<PropertyResponse> search(PropertySearchParams params, Long currentUserId) {
        LocalDate checkIn = params.getCheckIn() != null ? LocalDate.parse(params.getCheckIn()) : LocalDate.now();
        LocalDate checkOut = params.getCheckOut() != null ? LocalDate.parse(params.getCheckOut()) : LocalDate.now().plusDays(1);
        PageRequest pageRequest = PageRequest.of(params.getPage(), params.getSize());
        Page<Property> props = propertyRepository.search(
                params.getCity(), params.getMinPrice(), params.getMaxPrice(),
                params.getGuests(), params.getPropertyType(), params.getCategory(),
                checkIn, checkOut, pageRequest);
        return props.map(p -> {
            boolean wishlisted = currentUserId != null &&
                    wishlistRepository.existsByUserIdAndPropertyId(currentUserId, p.getId());
            return PropertyResponse.from(p, wishlisted);
        });
    }

    public PropertyResponse getById(Long id, Long currentUserId) {
        Property p = propertyRepository.findById(id)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        boolean wishlisted = currentUserId != null &&
                wishlistRepository.existsByUserIdAndPropertyId(currentUserId, p.getId());
        return PropertyResponse.from(p, wishlisted);
    }

    public Page<PropertyResponse> getMyProperties(Long hostId, int page, int size) {
        return propertyRepository.findByHostIdOrderByCreatedAtDesc(hostId, PageRequest.of(page, size))
                .map(PropertyResponse::from);
    }

    @Transactional
    public void toggleWishlist(Long propertyId, Long userId) {
        if (wishlistRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
            wishlistRepository.deleteByUserIdAndPropertyId(userId, propertyId);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new StayFinderException("User not found"));
            Property property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new StayFinderException("Property not found"));
            wishlistRepository.save(Wishlist.builder().user(user).property(property).build());
        }
    }

    public List<PropertyResponse> getWishlist(Long userId) {
        return propertyRepository.findWishlistedByUser(userId)
                .stream().map(p -> PropertyResponse.from(p, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateAvailability(Long propertyId, AvailabilityUpdateRequest req, Long hostId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        if (!p.getHost().getId().equals(hostId)) {
            throw new StayFinderException("Unauthorized");
        }
        LocalDate date = LocalDate.parse(req.getDate());
        PropertyAvailability av = availabilityRepository
                .findByPropertyIdAndDate(propertyId, date)
                .orElse(PropertyAvailability.builder().property(p).date(date).build());
        av.setAvailable(req.isAvailable());
        av.setCustomPrice(req.getCustomPrice());
        availabilityRepository.save(av);
    }

    public void updatePropertyRating(Long propertyId, BigDecimal avgRating, int totalReviews) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        p.setAvgRating(avgRating);
        p.setTotalReviews(totalReviews);
        propertyRepository.save(p);
    }

    public Page<PropertyResponse> getByStatus(PropertyStatus status, int page, int size) {
        return propertyRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                .map(PropertyResponse::from);
    }

    @Transactional
    public PropertyResponse approveProperty(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        p.setStatus(PropertyStatus.APPROVED);
        propertyRepository.save(p);

        notificationService.publishEvent(NotificationEvent.builder()
                .userId(p.getHost().getId())
                .userEmail(p.getHost().getEmail())
                .userFullName(p.getHost().getFullName())
                .title("Your listing is approved! 🎉")
                .message("'" + p.getTitle() + "' is now live on StayFinder.")
                .type("PROPERTY_APPROVED")
                .referenceId(propertyId)
                .propertyTitle(p.getTitle())
                .build());

        log.info("Property {} approved", propertyId);
        return PropertyResponse.from(p);
    }

    @Transactional
    public PropertyResponse rejectProperty(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        p.setStatus(PropertyStatus.REJECTED);
        propertyRepository.save(p);

        notificationService.publishEvent(NotificationEvent.builder()
                .userId(p.getHost().getId())
                .userEmail(p.getHost().getEmail())
                .userFullName(p.getHost().getFullName())
                .title("Your listing was not approved")
                .message("'" + p.getTitle() + "' was not approved. Please review our guidelines and resubmit.")
                .type("PROPERTY_REJECTED")
                .referenceId(propertyId)
                .propertyTitle(p.getTitle())
                .build());

        log.info("Property {} rejected", propertyId);
        return PropertyResponse.from(p);
    }

    @Transactional
    public void deleteProperty(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));

        // Notify host via Kafka/direct before deleting
        notificationService.publishEvent(NotificationEvent.builder()
                .userId(p.getHost().getId())
                .userEmail(p.getHost().getEmail())
                .userFullName(p.getHost().getFullName())
                .title("Your listing has been removed")
                .message("'" + p.getTitle() + "' has been removed by an administrator.")
                .type("PROPERTY_DELETED")
                .referenceId(propertyId)
                .propertyTitle(p.getTitle())
                .build());

        availabilityRepository.deleteByPropertyId(propertyId);
        wishlistRepository.deleteByPropertyId(propertyId);
        propertyRepository.deleteById(propertyId);
        log.info("Property {} deleted by admin", propertyId);
    }

    /* ── AI: Generate property description ──────────────────────── */
    public String generateDescription(GenerateDescriptionRequest req) {
        log.info("Generating AI description for {} in {}, {}", 
            req.getPropertyType(), req.getCity(), req.getState());
        
        return geminiAIService.generatePropertyDescription(
            req.getPropertyType(),
            req.getCity(),
            req.getState(),
            req.getBedrooms(),
            req.getBathrooms(),
            req.getMaxGuests(),
            req.getAmenities()
        );
    }

    /* ── AI: Generate review summaries manually ─────────────────── */
    @Transactional
    public Map<String, Object> generateReviewSummariesManually() {
        log.info("Manually triggering review summary generation...");

        // Find properties with 1+ reviews but no summary
        List<Property> properties = propertyRepository.findAll().stream()
                .filter(p -> p.getTotalReviews() >= 1 && p.getReviewSummary() == null)
                .toList();

        log.info("Found {} properties needing review summaries", properties.size());

        int successCount = 0;
        int failCount = 0;
        List<String> processedProperties = new java.util.ArrayList<>();

        for (Property property : properties) {
            try {
                String summary = generateSummaryForProperty(property);
                if (summary != null) {
                    property.setReviewSummary(summary);
                    propertyRepository.save(property);
                    successCount++;
                    processedProperties.add(property.getTitle() + " (ID: " + property.getId() + ")");
                    log.info("Generated summary for property: {}", property.getTitle());
                } else {
                    failCount++;
                    log.warn("Failed to generate summary for property: {}", property.getTitle());
                }
            } catch (Exception e) {
                failCount++;
                log.error("Error generating summary for property {}: {}", 
                    property.getId(), e.getMessage());
            }
        }

        log.info("Review summary generation completed. Success: {}, Failed: {}", 
            successCount, failCount);

        return Map.of(
            "totalFound", properties.size(),
            "successCount", successCount,
            "failCount", failCount,
            "processedProperties", processedProperties,
            "message", String.format("Generated %d summaries out of %d properties", 
                successCount, properties.size())
        );
    }

    /**
     * Generate summary for a specific property
     */
    private String generateSummaryForProperty(Property property) {
        // Get all reviews for the property (limit to 50 most recent)
        Page<Review> reviewPage = reviewRepository.findByPropertyIdOrderByCreatedAtDesc(
            property.getId(), 
            PageRequest.of(0, 50)
        );
        
        List<Review> reviews = reviewPage.getContent();
        
        if (reviews.isEmpty()) {
            return null;
        }

        List<String> reviewTexts = reviews.stream()
                .map(Review::getComment)
                .filter(comment -> comment != null && !comment.isBlank())
                .collect(Collectors.toList());

        if (reviewTexts.isEmpty()) {
            return null;
        }

        // Handle null avgRating
        double avgRating = property.getAvgRating() != null 
            ? property.getAvgRating().doubleValue() 
            : 0.0;

        return geminiAIService.summarizeReviews(reviewTexts, avgRating);
    }

    /* ── AI: Generate personalized recommendations ──────────────── */
    public Map<String, Object> getPersonalizedRecommendations(Long userId, String searchQuery) {
        log.info("Generating personalized recommendations for user: {}", userId);

        try {
            // Fetch user's booking history
            List<Booking> bookings = bookingRepository.findByGuestIdOrderByCreatedAtDesc(
                userId, 
                PageRequest.of(0, 20)
            ).getContent();

            // Fetch user's wishlist
            List<Property> wishlist = propertyRepository.findWishlistedByUser(userId);

            // Extract patterns from booking history
            List<String> previousCities = bookings.stream()
                    .map(b -> b.getProperty().getCity())
                    .distinct()
                    .limit(5)
                    .collect(Collectors.toList());

            List<String> previousPropertyTypes = bookings.stream()
                    .map(b -> b.getProperty().getPropertyType().toString())
                    .distinct()
                    .collect(Collectors.toList());

            List<String> previousCategories = bookings.stream()
                    .map(b -> b.getProperty().getCategory().toString())
                    .distinct()
                    .collect(Collectors.toList());

            List<String> wishlistedCategories = wishlist.stream()
                    .map(p -> p.getCategory().toString())
                    .distinct()
                    .collect(Collectors.toList());

            int avgGuests = bookings.isEmpty() ? 2 : 
                    (int) bookings.stream()
                            .mapToInt(Booking::getGuests)
                            .average()
                            .orElse(2.0);

            // Generate AI recommendation
            String recommendation = geminiAIService.generatePersonalizedRecommendations(
                previousCities,
                previousPropertyTypes,
                previousCategories,
                wishlistedCategories,
                avgGuests,
                searchQuery
            );

            return Map.of(
                "recommendation", recommendation != null ? recommendation : "",
                "hasHistory", !bookings.isEmpty(),
                "previousCities", previousCities,
                "avgGuests", avgGuests,
                "totalBookings", bookings.size(),
                "wishlistCount", wishlist.size()
            );

        } catch (Exception e) {
            log.error("Failed to generate personalized recommendations: {}", e.getMessage());
            return Map.of(
                "recommendation", "",
                "hasHistory", false,
                "error", "Failed to generate recommendations"
            );
        }
    }

    /* ── AI: Interpret natural language search ──────────────────── */
    public Map<String, String> interpretNaturalSearch(String query) {
        log.info("Interpreting natural language search: {}", query);
        
        try {
            Map<String, String> interpretation = geminiAIService.interpretSearchQuery(query);
            log.info("Search interpretation result: {}", interpretation);
            return interpretation;
        } catch (Exception e) {
            log.error("Failed to interpret search query: {}", e.getMessage());
            return Map.of();
        }
    }

    /* ── AI: Generate smart price recommendation ─────────────────── */
    public Map<String, Object> getSmartPriceRecommendation(Long propertyId) {
        log.info("Generating smart price recommendation for property: {}", propertyId);

        try {
            Property property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new StayFinderException("Property not found"));

            // Calculate average price in the same city and category
            // Calculate average price in area (handle OptionalDouble properly)
            OptionalDouble avgOptional = propertyRepository.findAll().stream()
                    .filter(p -> p.getCity().equalsIgnoreCase(property.getCity()) 
                              && p.getCategory() == property.getCategory()
                              && p.getId().longValue() != propertyId.longValue())
                    .filter(p -> p.getPricePerNight() != null) // Filter out null prices
                    .map(p -> p.getPricePerNight().doubleValue())
                    .filter(price -> price > 0)
                    .mapToDouble(Double::doubleValue)
                    .average();
            
            Double avgPriceInArea = avgOptional.isPresent() ? avgOptional.getAsDouble() : null;

            Map<String, Object> recommendation = geminiAIService.generatePriceRecommendation(
                property.getCity(),
                property.getState(),
                property.getPropertyType().toString(),
                property.getCategory().toString(),
                property.getBedrooms(),
                property.getBathrooms(),
                property.getMaxGuests(),
                property.getAmenities() != null ? new java.util.ArrayList<>(property.getAmenities()) : null,
                property.getPricePerNight() != null ? property.getPricePerNight().doubleValue() : null,
                avgPriceInArea
            );

            // Add property details to response
            recommendation.put("propertyId", propertyId);
            recommendation.put("currentPrice", property.getPricePerNight());
            recommendation.put("avgPriceInArea", avgPriceInArea);
            recommendation.put("city", property.getCity());
            recommendation.put("propertyType", property.getPropertyType());

            return recommendation;

        } catch (Exception e) {
            log.error("Failed to generate price recommendation: {}", e.getMessage());
            return Map.of("error", "Failed to generate recommendation: " + e.getMessage());
        }
    }

    /* ── AI: Generate smart price recommendation preview ──────────── */
    public Map<String, Object> getSmartPriceRecommendationPreview(
            String city,
            String state,
            String propertyType,
            String category,
            Integer bedrooms,
            Integer bathrooms,
            Integer maxGuests,
            List<String> amenities,
            Double currentPrice
    ) {
        log.info("Generating smart price recommendation preview for: {}, {}", city, state);

        try {
            // Calculate average price in the same city and category
            OptionalDouble avgOptional = propertyRepository.findAll().stream()
                    .filter(p -> p.getCity().equalsIgnoreCase(city) 
                              && p.getCategory().toString().equals(category))
                    .filter(p -> p.getPricePerNight() != null)
                    .map(p -> p.getPricePerNight().doubleValue())
                    .filter(price -> price > 0)
                    .mapToDouble(Double::doubleValue)
                    .average();
            
            Double avgPriceInArea = avgOptional.isPresent() ? avgOptional.getAsDouble() : null;

            Map<String, Object> recommendation = geminiAIService.generatePriceRecommendation(
                city,
                state,
                propertyType,
                category,
                bedrooms,
                bathrooms,
                maxGuests,
                amenities,
                currentPrice,
                avgPriceInArea
            );

            recommendation.put("avgPriceInArea", avgPriceInArea);
            recommendation.put("city", city);
            recommendation.put("propertyType", propertyType);

            return recommendation;

        } catch (Exception e) {
            log.error("Failed to generate price recommendation preview: {}", e.getMessage());
            return Map.of("error", "Failed to generate recommendation: " + e.getMessage());
        }
    }
}
