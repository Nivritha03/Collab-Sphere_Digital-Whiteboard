package com.whiteboard.model;

import lombok.Data;

public class AuthDTOs {

    @Data
    public static class SignUpRequest {
        private String username;
        private String email;
        private String password;
        private String confirmPassword;
        private String color;
    }

    @Data
    public static class SignInRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long userId;
        private String username;
        private String email;
        private String color;

        public AuthResponse(String token, Long userId, String username, String email, String color) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.color = color;
        }
    }
}
