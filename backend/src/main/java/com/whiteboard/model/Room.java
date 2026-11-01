package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @Column(name = "code", length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_by", nullable = false)
    private String createdBy; // email or username of creator

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "room_users",
        joinColumns = @JoinColumn(name = "room_code"),
        inverseJoinColumns = @JoinColumn(name = "users_id"),
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_code", "users_id"})
    )
    @Builder.Default
    private Set<User> users = new HashSet<>();
}