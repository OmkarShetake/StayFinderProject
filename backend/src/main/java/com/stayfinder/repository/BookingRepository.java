package com.stayfinder.repository;

import com.stayfinder.entity.Booking;
import com.stayfinder.entity.Booking.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByGuestIdOrderByCreatedAtDesc(Long guestId, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.property.host.id = :hostId ORDER BY b.createdAt DESC")
    Page<Booking> findByHostId(@Param("hostId") Long hostId, Pageable pageable);

    Optional<Booking> findByReferenceId(String referenceId);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.property.id = :propertyId
        AND b.status IN ('CONFIRMED','PENDING')
        AND b.checkIn < :checkOut
        AND b.checkOut > :checkIn
    """)
    boolean existsConflict(
            @Param("propertyId") Long propertyId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'PENDING'
        AND b.bookingType = 'REQUEST'
        AND b.property.host.id = :hostId
        ORDER BY b.createdAt DESC
    """)
    List<Booking> findPendingRequestsByHostId(@Param("hostId") Long hostId);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
        AND b.checkOut < :date
    """)
    List<Booking> findCompletable(@Param("date") LocalDate date);

    /* Used by scheduler to auto-complete past confirmed bookings */
    List<Booking> findByStatusAndCheckOutBefore(BookingStatus status, LocalDate date);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'PENDING'
        AND b.bookingType = 'INSTANT'
        AND b.createdAt < :expireTime
    """)
    List<Booking> findExpiredInstantBookings(@Param("expireTime") LocalDateTime expireTime);
}