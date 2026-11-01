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

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String snapshot;

    private long timestamp;
}