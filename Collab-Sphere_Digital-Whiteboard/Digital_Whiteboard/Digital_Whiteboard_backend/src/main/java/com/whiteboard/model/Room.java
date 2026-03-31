package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Data
public class Room {

    @Id
    private String code;

    @ManyToMany
    @JoinTable(
        name = "room_users",
        joinColumns = @JoinColumn(name = "room_code"),
        inverseJoinColumns = @JoinColumn(name = "users_id"),
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_code", "users_id"})
    )
    private Set<User> users;
}