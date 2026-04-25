package com.stayfinder.service;

import com.stayfinder.config.JwtUtil;
import com.stayfinder.dto.AuthDTOs.*;
import com.stayfinder.entity.RefreshToken;
import com.stayfinder.entity.User;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.PasswordResetTokenRepository;
import com.stayfinder.entity.PasswordResetToken;
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
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final EmailService emailService;

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

    /* ── Update profile ──────────────────────────────────────────── */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new StayFinderException("User not found"));
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        userRepository.save(user);
        log.info("Profile updated for user {}", user.getEmail());
        return UserResponse.from(user);
    }

    /* ── Forgot password ─────────────────────────────────────────── */
    @Transactional
    public void forgotPassword(String email, String appUrl) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return; // Silent — don't reveal if email exists

        // Delete any existing reset tokens
        passwordResetTokenRepository.deleteByUserId(user.getId());

        // Generate token
        String token = UUID.randomUUID().toString();
        PasswordResetToken prt = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        passwordResetTokenRepository.save(prt);

        // Send email
        String resetLink = appUrl + "/pages/reset-password.html?token=" + token;
        String html = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                    <tr><td style="background:#ff385c;padding:28px 40px">
                      <span style="color:white;font-size:22px;font-weight:700">stayfinder</span>
                    </td></tr>
                    <tr><td style="padding:40px">
                      <h2 style="margin:0 0 16px;font-size:22px;color:#222">Reset your password</h2>
                      <p style="color:#717171;font-size:15px;margin-bottom:24px">Hi %s, click the button below to reset your password. This link expires in 1 hour.</p>
                      <a href="%s" style="display:inline-block;padding:14px 28px;background:#ff385c;color:white;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none">Reset Password</a>
                      <p style="color:#aaa;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(user.getFullName(), resetLink);

        emailService.send(user.getEmail(), "Reset your StayFinder password", html);
        log.info("Password reset email sent to {}", email);
    }

    /* ── Reset password ──────────────────────────────────────────── */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new StayFinderException("Invalid or expired reset link"));

        if (prt.isExpired()) {
            passwordResetTokenRepository.delete(prt);
            throw new StayFinderException("Reset link has expired. Please request a new one.");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete used token
        passwordResetTokenRepository.delete(prt);
        // Also invalidate all refresh tokens
        refreshTokenRepository.deleteByUserId(user.getId());

        log.info("Password reset for user {}", user.getEmail());
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