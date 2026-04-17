package com.stayfinder.repository;

import com.stayfinder.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByPropertyIdOrderByCreatedAtDesc(Long propertyId, Pageable pageable);
    boolean existsByBookingId(Long bookingId);

    @Query("SELECT AVG(r.overall) FROM Review r WHERE r.property.id = :propertyId")
    Double avgOverallByPropertyId(@Param("propertyId") Long propertyId);

    @Query("""
        SELECT AVG(r.cleanliness), AVG(r.communication), AVG(r.checkin),
               AVG(r.location), AVG(r.value), AVG(r.accuracy)
        FROM Review r WHERE r.property.id = :propertyId
    """)
    Object[] avgDetailedByPropertyId(@Param("propertyId") Long propertyId);
}
