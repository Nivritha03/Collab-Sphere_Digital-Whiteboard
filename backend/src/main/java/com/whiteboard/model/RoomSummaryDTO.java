package com.whiteboard.model;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummaryDTO {
    private String roomCode;
    private String roomName;
    private String createdBy;
    private String joinedAt;
    private String lastAccessedAt;
    private int participantCount;
    private boolean isActive;
    private boolean hasExited;
    private List<String> participants;
}
