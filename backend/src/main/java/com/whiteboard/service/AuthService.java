package com.whiteboard.service;

import com.whiteboard.model.User;
import com.whiteboard.model.AuthDTOs.*;
import com.whiteboard.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public AuthResponse signUp(SignUpRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        if (req.getConfirmPassword() != null && !req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }

        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        String color = (req.getColor() != null && !req.getColor().trim().isEmpty()) 
                ? req.getColor() 
                : "#3b82f6";

        User user = User.builder()
                .username(req.getUsername().trim())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .color(color)
                .build();

        User saved = userRepository.save(user);

        // Simple token format: user-id:random-uuid
        String token = "AUTH-" + saved.getId() + "-" + UUID.randomUUID().toString();
        return new AuthResponse(token, saved.getId(), saved.getUsername(), saved.getEmail(), saved.getColor());
    }

    public AuthResponse signIn(SignInRequest req) {
        if (req.getEmail() == null || req.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = "AUTH-" + user.getId() + "-" + UUID.randomUUID().toString();
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getColor());
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim());
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
