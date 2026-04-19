package com.stayfinder.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${stayfinder.mail.from}")
    private String fromAddress;

    @Value("${stayfinder.mail.enabled:true}")
    private boolean mailEnabled;

    /* ── Generic send ────────────────────────────────────────────── */
    @Async
    public void send(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.debug("Email disabled — skipping send to {}: {}", to, subject);
            return;
        }
        try {
            MimeMessage msg    = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setFrom(fromAddress);
            h.setTo(to);
            h.setSubject(subject);
            h.setText(htmlBody, true); // true = HTML
            mailSender.send(msg);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    /* ── Booking Confirmed ───────────────────────────────────────── */
    public void sendBookingConfirmed(String to, String guestName,
                                     String propertyTitle, String city,
                                     String checkIn, String checkOut,
                                     int nights, int guests,
                                     String totalAmount, String referenceId) {
        String subject = "Booking Confirmed — " + propertyTitle;
        String body    = baseTemplate(
            "Your booking is confirmed! 🎉",
            guestName,
            """
            <p>Great news! Your stay has been confirmed.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">Property</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">%s, %s</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">Check in</td>
                  <td style="padding:10px;border-bottom:1px solid #eee">%s</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">Check out</td>
                  <td style="padding:10px;border-bottom:1px solid #eee">%s</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">Duration</td>
                  <td style="padding:10px;border-bottom:1px solid #eee">%d night%s · %d guest%s</td></tr>
              <tr><td style="padding:10px;color:#717171">Total</td>
                  <td style="padding:10px;font-weight:700;color:#222">%s</td></tr>
            </table>
            <p style="font-size:13px;color:#717171">Reference: <strong>%s</strong></p>
            """.formatted(
                propertyTitle, city,
                checkIn, checkOut,
                nights, nights > 1 ? "s" : "",
                guests, guests > 1 ? "s" : "",
                totalAmount, referenceId
            )
        );
        send(to, subject, body);
    }

    /* ── Booking Cancelled ───────────────────────────────────────── */
    public void sendBookingCancelled(String to, String guestName,
                                     String propertyTitle, String referenceId) {
        String subject = "Booking Cancelled — " + propertyTitle;
        String body    = baseTemplate(
            "Booking Cancelled",
            guestName,
            """
            <p>Your booking for <strong>%s</strong> has been cancelled.</p>
            <p style="font-size:13px;color:#717171">Reference: <strong>%s</strong></p>
            <p style="color:#717171">If you didn't request this cancellation, please contact support.</p>
            """.formatted(propertyTitle, referenceId)
        );
        send(to, subject, body);
    }

    /* ── Booking Modified ────────────────────────────────────────── */
    public void sendBookingModified(String to, String guestName,
                                    String propertyTitle,
                                    String newCheckIn, String newCheckOut,
                                    String newTotal, String referenceId) {
        String subject = "Booking Updated — " + propertyTitle;
        String body    = baseTemplate(
            "Your dates have been updated 📅",
            guestName,
            """
            <p>Your booking for <strong>%s</strong> has been updated.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">New check in</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">%s</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#717171">New check out</td>
                  <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600">%s</td></tr>
              <tr><td style="padding:10px;color:#717171">New total</td>
                  <td style="padding:10px;font-weight:700;color:#222">%s</td></tr>
            </table>
            <p style="font-size:13px;color:#717171">Reference: <strong>%s</strong></p>
            """.formatted(propertyTitle, newCheckIn, newCheckOut, newTotal, referenceId)
        );
        send(to, subject, body);
    }

    /* ── Property Approved ───────────────────────────────────────── */
    public void sendPropertyApproved(String to, String hostName, String propertyTitle) {
        String subject = "Your listing is live! 🎉";
        String body    = baseTemplate(
            "Listing Approved!",
            hostName,
            """
            <p>Great news! Your property <strong>%s</strong> has been approved
               and is now live on StayFinder.</p>
            <p>Guests can now find and book your property.</p>
            """.formatted(propertyTitle)
        );
        send(to, subject, body);
    }

    /* ── Property Rejected ───────────────────────────────────────── */
    public void sendPropertyRejected(String to, String hostName, String propertyTitle) {
        String subject = "Listing Update Required — " + propertyTitle;
        String body    = baseTemplate(
            "Listing Needs Attention",
            hostName,
            """
            <p>Your property <strong>%s</strong> was not approved at this time.</p>
            <p>Please review our listing guidelines and resubmit with the required updates.</p>
            """.formatted(propertyTitle)
        );
        send(to, subject, body);
    }

    /* ── New Review ──────────────────────────────────────────────── */
    public void sendNewReview(String to, String hostName,
                               String propertyTitle, String guestName,
                               String rating) {
        String subject = "New review for " + propertyTitle;
        String body    = baseTemplate(
            "You have a new review ⭐",
            hostName,
            """
            <p><strong>%s</strong> left a <strong>%s-star</strong> review
               for <strong>%s</strong>.</p>
            <p>Log in to StayFinder to read the full review.</p>
            """.formatted(guestName, rating, propertyTitle)
        );
        send(to, subject, body);
    }

    /* ── Welcome Email ───────────────────────────────────────────── */
    public void sendWelcome(String to, String fullName) {
        String subject = "Welcome to StayFinder! 🏠";
        String body    = baseTemplate(
            "Welcome to StayFinder!",
            fullName,
            """
            <p>We're thrilled to have you on board.</p>
            <p>Start exploring thousands of unique stays across India —
               from beachside villas to mountain retreats.</p>
            <p>Happy travels! 🌍</p>
            """
        );
        send(to, subject, body);
    }

    /* ── HTML Base Template ──────────────────────────────────────── */
    private String baseTemplate(String heading, String recipientName, String content) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
            </head>
            <body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,
                         BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0"
                     style="background:#f7f7f7;padding:40px 0">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#ffffff;border-radius:12px;
                                overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

                    <!-- Header -->
                    <tr>
                      <td style="background:#ff385c;padding:28px 40px">
                        <span style="color:white;font-size:22px;font-weight:700;
                                     letter-spacing:-0.5px">stayfinder</span>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px">
                        <h2 style="margin:0 0 8px;font-size:24px;color:#222">%s</h2>
                        <p style="margin:0 0 24px;color:#717171;font-size:15px">
                          Hi %s,
                        </p>
                        <div style="color:#222;font-size:15px;line-height:1.6">
                          %s
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f7f7f7;padding:24px 40px;
                                 border-top:1px solid #eee">
                        <p style="margin:0;font-size:12px;color:#aaa;text-align:center">
                          © 2026 StayFinder. This email was sent to you as a registered user.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(heading, recipientName, content);
    }
}
