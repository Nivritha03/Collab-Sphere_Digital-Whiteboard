package com.whiteboard.config;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	    http
	        .cors(org.springframework.security.config.Customizer.withDefaults())
	        .csrf(csrf -> csrf.disable())
	        .headers(headers -> headers.frameOptions(frame -> frame.disable()))
	        .authorizeHttpRequests(auth -> auth
	            .requestMatchers("/ws/**").permitAll()
	            .requestMatchers("/api/**").permitAll()
	            .anyRequest().permitAll()
	        );

	    return http.build();
	}
}