package com.whiteboard.model;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomStateDTO {
    private String roomId;
    private String roomName;
    private String createdBy;
    private int participantCount;
    private long lastUpdatedAt;
    private String previewSnapshot; // latest snapshot JSON or data URL
    private List<WhiteboardElement> elements;
    private List<String> participants;
}
