package com.stayfinder.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kafka event payload published whenever a user action requires
 * an in-app notification + email to be delivered.
 *
 * Producer : BookingService / PropertyService / ReviewService
 * Consumer : NotificationEventConsumer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {

    // ── Recipient ──────────────────────────────────────────────────
    private Long   userId;       // DB id of the user to notify
    private String userEmail;    // denormalised — avoids extra DB query in consumer
    private String userFullName;

    // ── Notification content ───────────────────────────────────────
    private String title;
    private String message;

    // ── Event type (maps to email template) ────────────────────────
    private String type;         // BOOKING_CONFIRMED | BOOKING_CANCELLED |
                                 // BOOKING_MODIFIED  | BOOKING_REQUEST    |
                                 // BOOKING_REJECTED  | PROPERTY_APPROVED  |
                                 // PROPERTY_REJECTED | NEW_REVIEW

    // ── Optional rich data for typed email templates ───────────────
    private Long   referenceId;  // booking or property id

    // Booking-specific fields (null for other event types)
    private String propertyTitle;
    private String propertyCity;
    private String checkIn;
    private String checkOut;
    private Integer nights;
    private Integer guests;
    private String  totalAmount;
    private String  bookingReference;

    // Review-specific fields
    private String guestName;
    private String rating;
}
