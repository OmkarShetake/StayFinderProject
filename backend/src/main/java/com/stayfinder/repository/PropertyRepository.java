package com.stayfinder.repository;

import com.stayfinder.entity.Property;
import com.stayfinder.entity.Property.PropertyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    Page<Property> findByHostIdOrderByCreatedAtDesc(Long hostId, Pageable pageable);

    Page<Property> findByStatusOrderByCreatedAtDesc(PropertyStatus status, Pageable pageable);

    @Query(value = """
        SELECT * FROM properties p
        WHERE p.status = 'APPROVED'
        AND (:city IS NULL OR LOWER(p.city)
            LIKE LOWER(CONCAT('%', :city, '%')))
        AND (:minPrice IS NULL OR p.price_per_night >= :minPrice)
        AND (:maxPrice IS NULL OR p.price_per_night <= :maxPrice)
        AND (:guests IS NULL OR p.max_guests >= :guests)
        AND (:propertyType IS NULL OR p.property_type = :propertyType)
        AND (:category IS NULL OR p.category = :category)
        AND p.id NOT IN (
            SELECT b.property_id FROM bookings b
            WHERE b.status IN ('CONFIRMED','PENDING')
            AND b.check_in < :checkOut
            AND b.check_out > :checkIn
        )
        ORDER BY p.avg_rating DESC
    """,
            countQuery = """
        SELECT COUNT(*) FROM properties p
        WHERE p.status = 'APPROVED'
        AND (:city IS NULL OR LOWER(p.city)
            LIKE LOWER(CONCAT('%', :city, '%')))
        AND (:minPrice IS NULL OR p.price_per_night >= :minPrice)
        AND (:maxPrice IS NULL OR p.price_per_night <= :maxPrice)
        AND (:guests IS NULL OR p.max_guests >= :guests)
        AND (:propertyType IS NULL OR p.property_type = :propertyType)
        AND (:category IS NULL OR p.category = :category)
        AND p.id NOT IN (
            SELECT b.property_id FROM bookings b
            WHERE b.status IN ('CONFIRMED','PENDING')
            AND b.check_in < :checkOut
            AND b.check_out > :checkIn
        )
    """,
            nativeQuery = true)
    Page<Property> search(
            @Param("city") String city,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("guests") Integer guests,
            @Param("propertyType") String propertyType,
            @Param("category") String category,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            Pageable pageable);

    @Query("""
        SELECT p FROM Property p
        JOIN Wishlist w ON w.property.id = p.id
        WHERE w.user.id = :userId
        ORDER BY w.createdAt DESC
    """)
    List<Property> findWishlistedByUser(@Param("userId") Long userId);
}