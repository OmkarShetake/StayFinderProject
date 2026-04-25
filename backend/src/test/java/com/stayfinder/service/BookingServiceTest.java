package com.stayfinder.service;

import com.stayfinder.dto.BookingDTOs.*;
import com.stayfinder.entity.*;
import com.stayfinder.entity.Booking.BookingStatus;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.BookingRepository;
import com.stayfinder.repository.PropertyRepository;
import com.stayfinder.repository.ReviewRepository;
import com.stayfinder.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService Tests")
class BookingServiceTest {

    @Mock BookingRepository     bookingRepository;
    @Mock PropertyRepository    propertyRepository;
    @Mock UserRepository        userRepository;
    @Mock ReviewRepository      reviewRepository;
    @Mock NotificationService   notificationService;

    @InjectMocks BookingService bookingService;

    private User    host;
    private User    guest;
    private Property property;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bookingService, "serviceFeePercent", 12);

        host = User.builder()
                .id(1L).email("host@test.com").fullName("Host User")
                .role(User.Role.GUEST).host(true).enabled(true).build();

        guest = User.builder()
                .id(2L).email("guest@test.com").fullName("Guest User")
                .role(User.Role.GUEST).host(false).enabled(true).build();

        property = Property.builder()
                .id(10L).host(host).title("Test Property")
                .pricePerNight(new BigDecimal("2000"))
                .cleaningFee(new BigDecimal("500"))
                .maxGuests(4).bedrooms(2).bathrooms(1).beds(2)
                .instantBook(true)
                .status(Property.PropertyStatus.APPROVED)
                .build();
    }

    /* ── Create Booking ───────────────────────────────────────────── */

    @Test
    @DisplayName("createBooking — instant book creates CONFIRMED booking")
    void createBooking_instantBook_confirmed() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));
        when(userRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(bookingRepository.existsConflict(any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            ReflectionTestUtils.setField(b, "id", 100L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(req, 2L);

        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
        assertThat(response.getBookingType()).isEqualTo("INSTANT");
        verify(bookingRepository).save(any(Booking.class));
        verify(notificationService, times(2)).createAndSend(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("createBooking — request book creates PENDING booking")
    void createBooking_requestBook_pending() {
        property.setInstantBook(false);

        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));
        when(userRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(bookingRepository.existsConflict(any(), any(), any())).thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            ReflectionTestUtils.setField(b, "id", 101L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(req, 2L);

        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getBookingType()).isEqualTo("REQUEST");
    }

    @Test
    @DisplayName("createBooking — throws when host tries to book own property")
    void createBooking_hostBooksOwnProperty_throws() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(1);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));

        assertThatThrownBy(() -> bookingService.createBooking(req, 1L)) // host id = 1
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("cannot book your own property");
    }

    @Test
    @DisplayName("createBooking — throws when dates conflict")
    void createBooking_dateConflict_throws() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));
        when(bookingRepository.existsConflict(any(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> bookingService.createBooking(req, 2L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("not available for selected dates");
    }

    @Test
    @DisplayName("createBooking — throws when guests exceed max")
    void createBooking_exceedsMaxGuests_throws() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(10); // max is 4

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));

        assertThatThrownBy(() -> bookingService.createBooking(req, 2L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("Exceeds maximum guests");
    }

    @Test
    @DisplayName("createBooking — throws when check-in is in the past")
    void createBooking_pastCheckIn_throws() {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().minusDays(1)); // past
        req.setCheckOut(LocalDate.now().plusDays(2));
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));

        assertThatThrownBy(() -> bookingService.createBooking(req, 2L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("cannot be in the past");
    }

    @Test
    @DisplayName("createBooking — throws when property not approved")
    void createBooking_propertyNotApproved_throws() {
        property.setStatus(Property.PropertyStatus.PENDING);

        CreateBookingRequest req = new CreateBookingRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1));
        req.setCheckOut(LocalDate.now().plusDays(3));
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));

        assertThatThrownBy(() -> bookingService.createBooking(req, 2L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("not available for booking");
    }

    /* ── Cancel Booking ───────────────────────────────────────────── */

    @Test
    @DisplayName("cancelBooking — success cancels confirmed booking")
    void cancelBooking_success() {
        Booking booking = Booking.builder()
                .id(100L).guest(guest).property(property)
                .status(BookingStatus.CONFIRMED)
                .checkIn(LocalDate.now().plusDays(5))
                .checkOut(LocalDate.now().plusDays(8))
                .build();

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);

        BookingResponse response = bookingService.cancelBooking(100L, 2L);

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(notificationService).createAndSend(eq(1L), any(), any(), eq("BOOKING_CANCELLED"), any());
    }

    @Test
    @DisplayName("cancelBooking — throws when trying to cancel completed booking")
    void cancelBooking_completed_throws() {
        Booking booking = Booking.builder()
                .id(100L).guest(guest).property(property)
                .status(BookingStatus.COMPLETED)
                .build();

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(100L, 2L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("Cannot cancel a completed booking");
    }

    @Test
    @DisplayName("cancelBooking — throws when unauthorized user tries to cancel")
    void cancelBooking_unauthorized_throws() {
        Booking booking = Booking.builder()
                .id(100L).guest(guest).property(property)
                .status(BookingStatus.CONFIRMED)
                .build();

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(100L, 99L)) // wrong user
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("Unauthorized");
    }

    /* ── Price Calculation ────────────────────────────────────────── */

    @Test
    @DisplayName("previewPrice — calculates correct total")
    void previewPrice_correctCalculation() {
        PricePreviewRequest req = new PricePreviewRequest();
        req.setPropertyId(10L);
        req.setCheckIn(LocalDate.now().plusDays(1).toString());
        req.setCheckOut(LocalDate.now().plusDays(4).toString()); // 3 nights
        req.setGuests(2);

        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));

        PricePreviewResponse response = bookingService.previewPrice(req);

        // 3 nights × ₹2000 = ₹6000 base
        // service fee = 12% of ₹6000 = ₹720
        // cleaning fee = ₹500
        // total = ₹7220
        assertThat(response.getNights()).isEqualTo(3);
        assertThat(response.getBaseAmount()).isEqualByComparingTo(new BigDecimal("6000.00"));
        assertThat(response.getServiceFee()).isEqualByComparingTo(new BigDecimal("720.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("7220.00"));
    }
}
