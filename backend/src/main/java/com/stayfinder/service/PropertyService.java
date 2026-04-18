package com.stayfinder.service;

import com.stayfinder.dto.PropertyDTOs.*;
import com.stayfinder.entity.*;
import com.stayfinder.entity.Property.PropertyStatus;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.*;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyAvailabilityRepository availabilityRepository;
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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
        notificationService.createAndSend(p.getHost().getId(),
                "Your listing is approved! 🎉",
                "'" + p.getTitle() + "' is now live on StayFinder.",
                "PROPERTY_APPROVED", propertyId);
        return PropertyResponse.from(p);
    }

    @Transactional
    public PropertyResponse rejectProperty(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));
        p.setStatus(PropertyStatus.REJECTED);
        propertyRepository.save(p);
        notificationService.createAndSend(p.getHost().getId(),
                "Your listing was rejected",
                "'" + p.getTitle() + "' was not approved. Please review our guidelines and resubmit.",
                "PROPERTY_REJECTED", propertyId);
        log.info("Property {} rejected", propertyId);
        return PropertyResponse.from(p);
    }

    /* ── Admin: permanently delete a property ───────────────────── */
    @Transactional
    public void deleteProperty(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new StayFinderException("Property not found"));

        // Notify host before deletion
        notificationService.createAndSend(p.getHost().getId(),
                "Your listing has been removed",
                "'" + p.getTitle() + "' has been removed by an administrator.",
                "PROPERTY_DELETED", propertyId);

        // Delete availability records first (FK constraint)
        availabilityRepository.deleteByPropertyId(propertyId);

        // Delete wishlists referencing this property
        wishlistRepository.deleteByPropertyId(propertyId);

        // Delete the property (cascades to images, bookings, reviews via DB cascade)
        propertyRepository.deleteById(propertyId);

        log.info("Property {} deleted by admin", propertyId);
    }
}