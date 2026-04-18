package com.stayfinder.service;

import com.stayfinder.config.JwtUtil;
import com.stayfinder.dto.AuthDTOs.*;
import com.stayfinder.entity.RefreshToken;
import com.stayfinder.entity.User;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.RefreshTokenRepository;
import com.stayfinder.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    /* ── Create default users on startup (runs ONCE only) ───────── */
    @PostConstruct
    public void createDefaultUsers() {
        createUserIfNotExists(
                "admin@stayfinder.com",
                "Admin@123",
                "Admin User",
                "9999999999",
                User.Role.ADMIN,
                false
        );
        createUserIfNotExists(
                "host@stayfinder.com",
                "Admin@123",
                "Host User",
                "8888888888",
                User.Role.GUEST,
                true
        );
        createUserIfNotExists(
                "guest@stayfinder.com",
                "Admin@123",
                "Guest User",
                "7777777777",
                User.Role.GUEST,
                false
        );
    }

    private void createUserIfNotExists(
            String email,
            String password,
            String name,
            String phone,
            User.Role role,
            boolean isHost
    ) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .fullName(name)
                    .phone(phone)
                    .role(role)
                    .enabled(true)
                    .host(isHost)
                    .build();
            userRepository.save(user);
            log.info("Default user created: {}", email);
        }
    }

    /* ── Register ────────────────────────────────────────────────── */
    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new StayFinderException("Email already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(User.Role.GUEST)
                .enabled(true)
                .host(false)
                .build();
        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());
        return buildTokenResponse(user);
    }

    /* ── Login ───────────────────────────────────────────────────── */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new StayFinderException("Invalid email or password");
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new StayFinderException("User not found"));
        log.info("User logged in: {}", user.getEmail());
        return buildTokenResponse(user);
    }

    /* ── Refresh token ───────────────────────────────────────────── */
    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        RefreshToken rt = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() -> new StayFinderException("Invalid refresh token"));

        if (rt.isExpired()) {
            refreshTokenRepository.delete(rt);
            throw new StayFinderException("Refresh token expired. Please login again.");
        }

        User user = rt.getUser();
        refreshTokenRepository.delete(rt);
        return buildTokenResponse(user);
    }

    /* ── Become host ─────────────────────────────────────────────── */
    @Transactional
    public void becomeHost(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new StayFinderException("User not found"));
        user.setHost(true);
        userRepository.save(user);
        log.info("User {} became a host", user.getEmail());
    }

    /* ── Token building ──────────────────────────────────────────── */
    private TokenResponse buildTokenResponse(User user) {
        String accessToken = jwtUtil.generateToken(user);
        String refreshTokenStr = createRefreshToken(user);
        return new TokenResponse(
                accessToken,
                refreshTokenStr,
                jwtUtil.getExpiration(),
                UserResponse.from(user)
        );
    }

    private String createRefreshToken(User user) {
        // Delete any existing refresh tokens for this user (single session)
        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
                .build();
        return refreshTokenRepository.save(rt).getToken();
    }
}