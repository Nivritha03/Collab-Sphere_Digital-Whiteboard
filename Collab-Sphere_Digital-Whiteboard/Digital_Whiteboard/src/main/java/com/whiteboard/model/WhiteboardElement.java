package com.whiteboard.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
public class WhiteboardElement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomCode;

    private String tool;

    private double x0;
    private double y0;
    private double x1;
    private double y1;

    private String color;
    private int size;

    private String strokeId;
    private String senderId;

    private Boolean isFinished;

    @Column(length = 2000)
    private String text;
}