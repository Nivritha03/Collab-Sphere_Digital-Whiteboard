package com.whiteboard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic"); // DO NOT CHANGE
        config.setUserDestinationPrefix("/user");
        config.setApplicationDestinationPrefixes("/app"); // DO NOT CHANGE
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Plain WebSocket endpoint (no SockJS) — browsers can connect here without
        // XHR/CORS preflight
        // Native WebSocket upgrade requests are NOT subject to CORS blocking by the
        // browser
        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns("*");

        // SockJS endpoint kept for backward compatibility
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                .withSockJS();
    }
}