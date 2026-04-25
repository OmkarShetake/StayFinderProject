package com.stayfinder.repository;

import com.stayfinder.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE m.booking.id = :bookingId AND m.receiver.id = :userId")
    void markReadByBookingAndReceiver(@Param("bookingId") Long bookingId, @Param("userId") Long userId);
}
