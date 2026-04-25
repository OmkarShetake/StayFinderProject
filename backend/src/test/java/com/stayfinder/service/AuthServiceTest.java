package com.stayfinder.service;

import com.stayfinder.config.JwtUtil;
import com.stayfinder.dto.AuthDTOs.*;
import com.stayfinder.entity.RefreshToken;
import com.stayfinder.entity.User;
import com.stayfinder.exception.StayFinderException;
import com.stayfinder.repository.PasswordResetTokenRepository;
import com.stayfinder.repository.RefreshTokenRepository;
import com.stayfinder.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @Mock UserRepository              userRepository;
    @Mock RefreshTokenRepository      refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock JwtUtil                     jwtUtil;
    @Mock PasswordEncoder             passwordEncoder;
    @Mock AuthenticationManager       authManager;
    @Mock EmailService                emailService;

    @InjectMocks AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L);
    }

    /* ── Register ─────────────────────────────────────────────────── */

    @Test
    @DisplayName("register — success creates user and returns tokens")
    void register_success() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@example.com");
        req.setPassword("password123");
        req.setFullName("Test User");
        req.setPhone("9999999999");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            ReflectionTestUtils.setField(u, "id", 1L);
            return u;
        });
        when(jwtUtil.generateToken(any())).thenReturn("access-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> {
            RefreshToken rt = i.getArgument(0);
            return rt;
        });

        TokenResponse response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register — throws when email already exists")
    void register_duplicateEmail_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existing@example.com");
        req.setPassword("password123");
        req.setFullName("Test User");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    /* ── Login ────────────────────────────────────────────────────── */

    @Test
    @DisplayName("login — success returns tokens")
    void login_success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("password123");

        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .password("hashed")
                .fullName("Test User")
                .role(User.Role.GUEST)
                .enabled(true)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any())).thenReturn("access-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TokenResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("login — throws on bad credentials")
    void login_badCredentials_throws() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("wrongpassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("Invalid email or password");
    }

    /* ── Refresh ──────────────────────────────────────────────────── */

    @Test
    @DisplayName("refresh — success with valid token")
    void refresh_success() {
        User user = User.builder()
                .id(1L).email("user@example.com")
                .fullName("Test").role(User.Role.GUEST).enabled(true).build();

        RefreshToken rt = RefreshToken.builder()
                .token("valid-refresh-token")
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken("valid-refresh-token");

        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(rt));
        when(jwtUtil.generateToken(any())).thenReturn("new-access-token");
        when(jwtUtil.getExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        TokenResponse response = authService.refresh(req);

        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        verify(refreshTokenRepository).delete(rt);
    }

    @Test
    @DisplayName("refresh — throws on expired token")
    void refresh_expiredToken_throws() {
        User user = User.builder()
                .id(1L).email("user@example.com")
                .fullName("Test").role(User.Role.GUEST).enabled(true).build();

        RefreshToken rt = RefreshToken.builder()
                .token("expired-token")
                .user(user)
                .expiresAt(LocalDateTime.now().minusDays(1)) // expired
                .build();

        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken("expired-token");

        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(rt));

        assertThatThrownBy(() -> authService.refresh(req))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("expired");

        verify(refreshTokenRepository).delete(rt);
    }

    /* ── Become Host ──────────────────────────────────────────────── */

    @Test
    @DisplayName("becomeHost — sets host flag to true")
    void becomeHost_success() {
        User user = User.builder()
                .id(1L).email("user@example.com")
                .fullName("Test").role(User.Role.GUEST)
                .host(false).enabled(true).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        authService.becomeHost(1L);

        assertThat(user.isHost()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("becomeHost — throws when user not found")
    void becomeHost_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.becomeHost(99L))
                .isInstanceOf(StayFinderException.class)
                .hasMessageContaining("User not found");
    }
}
