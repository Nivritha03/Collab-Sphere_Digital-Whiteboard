package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_memberships", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "room_code"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_code", referencedColumnName = "code", nullable = false)
    private Room room;

    @Builder.Default
    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt = LocalDateTime.now();

    // Still in the room vs explicitly exited
    @Builder.Default
    @Column(name = "has_exited")
    private boolean hasExited = false;

    // Transient online state
    @Builder.Default
    @Column(name = "is_online")
    private boolean isOnline = true;
}
