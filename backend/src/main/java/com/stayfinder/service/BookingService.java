package com.stayfinder.service;

import com.stayfinder.dto.BookingDTOs.*;
import com.stayfinder.entity.Booking;
import com.stayfinder.entity.Booking.BookingStatus;
import com.stayfinder.entity.Property;
import com.stayfinder.entity.User;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.BookingRepository;
import com.stayfinder.repository.PropertyRepository;
import com.stayfinder.repository.UserRepository;
import com.stayfinder.repository.ReviewRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    @Value("${stayfinder.service-fee-percent}")
    private int serviceFeePercent;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest req, Long guestId) {
        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new StayFinderException("Property not found"));

        if (property.getStatus() != Property.PropertyStatus.APPROVED) {
            throw new StayFinderException("Property is not available for booking");
        }

        if (property.getHost().getId().equals(guestId)) {
            throw new StayFinderException("You cannot book your own property");
        }

        if (req.getCheckIn().isBefore(LocalDate.now())) {
            throw new StayFinderException("Check-in date cannot be in the past");
        }

        if (!req.getCheckOut().isAfter(req.getCheckIn())) {
            throw new StayFinderException("Check-out must be after check-in");
        }

        if (req.getGuests() > property.getMaxGuests()) {
            throw new StayFinderException("Exceeds maximum guests (" + property.getMaxGuests() + ")");
        }

        if (bookingRepository.existsConflict(req.getPropertyId(), req.getCheckIn(), req.getCheckOut())) {
            throw new StayFinderException("Property is not available for selected dates");
        }

        User guest = userRepository.findById(guestId)
                .orElseThrow(() -> new StayFinderException("User not found"));

        // Price calculation
        int nights = (int) ChronoUnit.DAYS.between(req.getCheckIn(), req.getCheckOut());
        BigDecimal baseAmount = calculateBaseAmount(property, req.getCheckIn(), req.getCheckOut(), nights);
        BigDecimal cleaningFee = property.getCleaningFee();
        BigDecimal serviceFee = baseAmount.multiply(BigDecimal.valueOf(serviceFeePercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseAmount.add(cleaningFee).add(serviceFee);

        String bookingType = property.isInstantBook() ? "INSTANT" : "REQUEST";
        BookingStatus initialStatus = property.isInstantBook() ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

        Booking booking = Booking.builder()
                .referenceId("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .property(property)
                .guest(guest)
                .checkIn(req.getCheckIn())
                .checkOut(req.getCheckOut())
                .guests(req.getGuests())
                .nights(nights)
                .baseAmount(baseAmount)
                .cleaningFee(cleaningFee)
                .serviceFee(serviceFee)
                .totalAmount(totalAmount)
                .status(initialStatus)
                .bookingType(bookingType)
                .message(req.getMessage())
                .build();

        bookingRepository.save(booking);

        // Notify host
        if (property.isInstantBook()) {
            notificationService.createAndSend(property.getHost().getId(),
                    "New booking confirmed! 🏠",
                    guest.getFullName() + " booked " + property.getTitle() +
                            " for " + nights + " nights.",
                    "BOOKING_CONFIRMED", booking.getId());
            notificationService.createAndSend(guestId,
                    "Booking confirmed! 🎉",
                    "Your stay at " + property.getTitle() + " is confirmed. Ref: " + booking.getReferenceId(),
                    "BOOKING_CONFIRMED", booking.getId());
        } else {
            notificationService.createAndSend(property.getHost().getId(),
                    "New booking request 📩",
                    guest.getFullName() + " has requested to book " + property.getTitle() + ".",
                    "BOOKING_REQUEST", booking.getId());
        }

        log.info("Booking created: {} type: {} status: {}",
                booking.getReferenceId(), bookingType, initialStatus);
        return BookingResponse.from(booking);
    }

    public PricePreviewResponse previewPrice(PricePreviewRequest req) {
        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new StayFinderException("Property not found"));

        LocalDate checkIn = LocalDate.parse(req.getCheckIn());
        LocalDate checkOut = LocalDate.parse(req.getCheckOut());
        int nights = (int) ChronoUnit.DAYS.between(checkIn, checkOut);

        BigDecimal baseAmount = calculateBaseAmount(property, checkIn, checkOut, nights);
        BigDecimal cleaningFee = property.getCleaningFee();
        BigDecimal serviceFee = baseAmount.multiply(BigDecimal.valueOf(serviceFeePercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal longStayDiscount = BigDecimal.ZERO;
        if (nights >= 7 && property.getLongStayDiscount() != null &&
                property.getLongStayDiscount().compareTo(BigDecimal.ZERO) > 0) {
            longStayDiscount = baseAmount.multiply(property.getLongStayDiscount())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            baseAmount = baseAmount.subtract(longStayDiscount);
        }

        PricePreviewResponse resp = new PricePreviewResponse();
        resp.setNights(nights);
        resp.setPricePerNight(property.getPricePerNight());
        resp.setBaseAmount(baseAmount);
        resp.setCleaningFee(cleaningFee);
        resp.setServiceFee(serviceFee);
        resp.setLongStayDiscount(longStayDiscount);
        resp.setTotalAmount(baseAmount.add(cleaningFee).add(serviceFee));
        return resp;
    }

    private BigDecimal calculateBaseAmount(Property p, LocalDate checkIn, LocalDate checkOut, int nights) {
        BigDecimal total = BigDecimal.ZERO;
        LocalDate date = checkIn;
        while (date.isBefore(checkOut)) {
            boolean isWeekend = date.getDayOfWeek() == DayOfWeek.SATURDAY ||
                    date.getDayOfWeek() == DayOfWeek.SUNDAY;
            BigDecimal nightPrice = (isWeekend && p.getWeekendPrice() != null)
                    ? p.getWeekendPrice() : p.getPricePerNight();
            total = total.add(nightPrice);
            date = date.plusDays(1);
        }
        return total;
    }

    public Page<BookingResponse> getMyBookings(Long guestId, int page, int size) {
        return bookingRepository.findByGuestIdOrderByCreatedAtDesc(guestId, PageRequest.of(page, size))
                .map(b -> {
                    // ── FIXED: canReview is true when:
                    // 1. Status is COMPLETED, OR
                    // 2. Status is CONFIRMED and checkout date has already passed
                    //    (handles bookings not yet auto-completed by scheduler)
                    // AND the guest has not already submitted a review
                    boolean checkoutPassed = b.getCheckOut().isBefore(LocalDate.now());
                    boolean isEligibleStatus = b.getStatus() == BookingStatus.COMPLETED ||
                            (b.getStatus() == BookingStatus.CONFIRMED && checkoutPassed);
                    boolean alreadyReviewed = reviewRepository.existsByBookingId(b.getId());
                    boolean canReview = isEligibleStatus && !alreadyReviewed;
                    return BookingResponse.from(b, canReview);
                });
    }

    public Page<BookingResponse> getHostBookings(Long hostId, int page, int size) {
        return bookingRepository.findByHostId(hostId, PageRequest.of(page, size))
                .map(BookingResponse::from);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long hostId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));
        if (!b.getProperty().getHost().getId().equals(hostId)) {
            throw new StayFinderException("Unauthorized");
        }
        b.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(b);
        notificationService.createAndSend(b.getGuest().getId(),
                "Booking confirmed! 🎉",
                "Your request for " + b.getProperty().getTitle() + " has been accepted.",
                "BOOKING_CONFIRMED", bookingId);
        return BookingResponse.from(b);
    }

    @Transactional
    public BookingResponse rejectBooking(Long bookingId, Long hostId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));
        if (!b.getProperty().getHost().getId().equals(hostId)) {
            throw new StayFinderException("Unauthorized");
        }
        b.setStatus(BookingStatus.REJECTED);
        bookingRepository.save(b);
        notificationService.createAndSend(b.getGuest().getId(),
                "Booking request declined",
                "Your request for " + b.getProperty().getTitle() + " was not accepted.",
                "BOOKING_REJECTED", bookingId);
        return BookingResponse.from(b);
    }

    @Transactional
    public BookingResponse getBookingById(Long bookingId, Long guestId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));
        if (!b.getGuest().getId().equals(guestId)) {
            throw new StayFinderException("Unauthorized");
        }
        return BookingResponse.from(b);
    }

    public Page<BookingResponse> getAllBookings(int page, int size) {
        return bookingRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(BookingResponse::from);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long guestId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));
        if (!b.getGuest().getId().equals(guestId)) {
            throw new StayFinderException("Unauthorized");
        }
        if (b.getStatus() == BookingStatus.COMPLETED) {
            throw new StayFinderException("Cannot cancel a completed booking");
        }
        b.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(b);
        notificationService.createAndSend(b.getProperty().getHost().getId(),
                "Booking cancelled",
                b.getGuest().getFullName() + " cancelled their booking for " + b.getProperty().getTitle(),
                "BOOKING_CANCELLED", bookingId);
        return BookingResponse.from(b);
    }

    /* ── Modify booking dates / guests ──────────────────────────── */
    @Transactional
    public BookingResponse modifyBooking(Long bookingId,
                                         @Valid ModifyBookingRequest req,
                                         Long guestId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new StayFinderException("Booking not found"));

        if (!b.getGuest().getId().equals(guestId)) {
            throw new StayFinderException("Unauthorized");
        }
        if (b.getStatus() != BookingStatus.CONFIRMED &&
                b.getStatus() != BookingStatus.PENDING) {
            throw new StayFinderException("Only confirmed or pending bookings can be modified");
        }
        if (req.getCheckIn().isBefore(LocalDate.now())) {
            throw new StayFinderException("Check-in date cannot be in the past");
        }
        if (!req.getCheckOut().isAfter(req.getCheckIn())) {
            throw new StayFinderException("Check-out must be after check-in");
        }
        if (req.getGuests() > b.getProperty().getMaxGuests()) {
            throw new StayFinderException(
                    "Exceeds maximum guests (" + b.getProperty().getMaxGuests() + ")");
        }

        // Check availability — exclude current booking to avoid self-conflict
        boolean conflict = bookingRepository.existsConflictExcluding(
                b.getProperty().getId(), req.getCheckIn(), req.getCheckOut(), bookingId);
        if (conflict) {
            throw new StayFinderException("Property is not available for the selected dates");
        }

        // Recalculate price with new dates
        int nights            = (int) ChronoUnit.DAYS.between(req.getCheckIn(), req.getCheckOut());
        BigDecimal baseAmount = calculateBaseAmount(
                b.getProperty(), req.getCheckIn(), req.getCheckOut(), nights);
        BigDecimal serviceFee = baseAmount
                .multiply(BigDecimal.valueOf(serviceFeePercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseAmount.add(b.getCleaningFee()).add(serviceFee);

        // Apply changes
        b.setCheckIn(req.getCheckIn());
        b.setCheckOut(req.getCheckOut());
        b.setGuests(req.getGuests());
        b.setNights(nights);
        b.setBaseAmount(baseAmount);
        b.setServiceFee(serviceFee);
        b.setTotalAmount(totalAmount);
        bookingRepository.save(b);

        // Notify host
        notificationService.createAndSend(
                b.getProperty().getHost().getId(),
                "Booking dates changed 📅",
                b.getGuest().getFullName() + " changed their booking for " +
                        b.getProperty().getTitle() + " to " +
                        req.getCheckIn() + " → " + req.getCheckOut(),
                "BOOKING_MODIFIED", bookingId);

        log.info("Booking {} modified by guest {}", b.getReferenceId(), guestId);
        return BookingResponse.from(b);
    }

    /* ── Scheduled: auto-complete confirmed bookings whose checkout has passed ── */
    @Scheduled(cron = "0 0 1 * * *") // runs daily at 1 AM
    @Transactional
    public void autoCompleteBookings() {
        List<Booking> completable = bookingRepository
                .findByStatusAndCheckOutBefore(BookingStatus.CONFIRMED, LocalDate.now());
        if (completable.isEmpty()) return;
        completable.forEach(b -> {
            b.setStatus(BookingStatus.COMPLETED);
            log.info("Auto-completed booking: {}", b.getReferenceId());
        });
        bookingRepository.saveAll(completable);
        log.info("Auto-completed {} bookings", completable.size());
    }
}