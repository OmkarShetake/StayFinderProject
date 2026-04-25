package com.stayfinder.dto;

import com.stayfinder.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthDTOs {

    @Data
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 8)
        private String password;
        @NotBlank
        private String fullName;
        private String phone;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank
        private String fullName;
        private String phone;
        private String avatarUrl;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank @Email
        private String email;
        private String frontendUrl;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;
        @NotBlank @Size(min = 8)
        private String newPassword;
    }

    @Data
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserResponse user;

        public TokenResponse(String accessToken, String refreshToken,
                             long expiresIn, UserResponse user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
            this.user = user;
        }
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String avatarUrl;
        private User.Role role;
        private boolean host;
        private boolean superhost;

        public static UserResponse from(User u) {
            UserResponse r = new UserResponse();
            r.id = u.getId();
            r.email = u.getEmail();
            r.fullName = u.getFullName();
            r.phone = u.getPhone();
            r.avatarUrl = u.getAvatarUrl();
            r.role = u.getRole();
            r.host = u.isHost();
            r.superhost = u.isSuperhost();
            return r;
        }
    }
}
