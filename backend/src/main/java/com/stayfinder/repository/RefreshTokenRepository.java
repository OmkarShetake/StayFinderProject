package com.stayfinder.repository;

import com.stayfinder.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /* Delete old refresh tokens for a user when they log in again */
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}