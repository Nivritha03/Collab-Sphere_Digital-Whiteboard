package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
public class VersionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomCode;

    @Column(length = 20000)
    private String snapshot;

    private long timestamp;
}