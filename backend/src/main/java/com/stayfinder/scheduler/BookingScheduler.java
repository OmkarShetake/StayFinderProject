package com.stayfinder.scheduler;

import com.stayfinder.entity.Booking;
import com.stayfinder.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingScheduler {

    private final BookingRepository bookingRepository;

    // Auto-complete confirmed bookings whose checkout date has passed — runs every hour
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoCompleteBookings() {
        List<Booking> completable = bookingRepository.findCompletable(LocalDate.now());
        if (completable.isEmpty()) return;

        completable.forEach(b -> b.setStatus(Booking.BookingStatus.COMPLETED));
        bookingRepository.saveAll(completable);
        log.info("Auto-completed {} bookings", completable.size());
    }

    // Expire unprocessed instant bookings older than 15 minutes — runs every minute
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void expireStaleBookings() {
        LocalDateTime expireTime = LocalDateTime.now().minusMinutes(15);
        List<Booking> stale = bookingRepository.findExpiredInstantBookings(expireTime);
        if (stale.isEmpty()) return;

        stale.forEach(b -> b.setStatus(Booking.BookingStatus.CANCELLED));
        bookingRepository.saveAll(stale);
        log.info("Expired {} stale bookings", stale.size());
    }
}
