package com.stayfinder.repository;

import com.stayfinder.entity.PropertyAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PropertyAvailabilityRepository extends JpaRepository<PropertyAvailability, Long> {

    Optional<PropertyAvailability> findByPropertyIdAndDate(Long propertyId, LocalDate date);

    @Query("""
        SELECT pa FROM PropertyAvailability pa
        WHERE pa.property.id = :propertyId
        AND pa.date BETWEEN :from AND :to
        ORDER BY pa.date
    """)
    List<PropertyAvailability> findByPropertyAndDateRange(
            @Param("propertyId") Long propertyId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
        SELECT COUNT(pa) > 0 FROM PropertyAvailability pa
        WHERE pa.property.id = :propertyId
        AND pa.date BETWEEN :from AND :to
        AND pa.available = false
    """)
    boolean hasUnavailableDates(
            @Param("propertyId") Long propertyId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    void deleteByPropertyId(Long propertyId);
}
