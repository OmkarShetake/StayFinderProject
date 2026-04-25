-- =============================================
-- V3: Messages table for host/guest chat
-- =============================================
CREATE TABLE messages (
    id          BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT       NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id   BIGINT       NOT NULL REFERENCES users(id),
    receiver_id BIGINT       NOT NULL REFERENCES users(id),
    content     TEXT         NOT NULL,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_booking_id ON messages(booking_id);
CREATE INDEX idx_messages_sender_id  ON messages(sender_id);
