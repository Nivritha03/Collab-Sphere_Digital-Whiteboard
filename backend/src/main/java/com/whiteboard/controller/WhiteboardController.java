package com.whiteboard.controller;

import com.whiteboard.model.WhiteboardElement;
import com.whiteboard.service.WhiteboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/whiteboard")
public class WhiteboardController {

    private final WhiteboardService service;
    private final com.whiteboard.service.VersionHistoryService versionHistoryService;
    private final com.whiteboard.service.RoomService roomService;

    public WhiteboardController(WhiteboardService service,
                                com.whiteboard.service.VersionHistoryService versionHistoryService,
                                com.whiteboard.service.RoomService roomService) {
        this.service = service;
        this.versionHistoryService = versionHistoryService;
        this.roomService = roomService;
    }

    @GetMapping("/{room}")
    public List<WhiteboardElement> getBoard(@PathVariable String room) {
        return service.getRoomData(room);
    }

    @GetMapping("/{room}/state")
    public com.whiteboard.model.RoomStateDTO getRoomState(@PathVariable String room) {
        List<WhiteboardElement> elements = service.getRoomData(room);
        List<com.whiteboard.model.VersionHistory> history = versionHistoryService.getHistory(room);
        String latestSnapshot = history.isEmpty() ? null : history.get(0).getSnapshot();
        long lastUpdated = history.isEmpty() ? System.currentTimeMillis() : history.get(0).getTimestamp();

        java.util.Optional<com.whiteboard.model.Room> r = roomService.findByCode(room);
        String roomName;
        String createdBy;
        if (r.isPresent()) {
            com.whiteboard.model.Room roomObj = r.get();
            roomName = (roomObj.getName() != null) ? roomObj.getName() : "Board #" + room.substring(0, Math.min(6, room.length()));
            createdBy = (roomObj.getCreatedBy() != null) ? roomObj.getCreatedBy() : "Unknown";
        } else {
            roomName = "Board #" + room.substring(0, Math.min(6, room.length()));
            createdBy = "Unknown";
        }

        return com.whiteboard.model.RoomStateDTO.builder()
                .roomId(room)
                .roomName(roomName)
                .createdBy(createdBy)
                .participantCount(1)
                .lastUpdatedAt(lastUpdated)
                .previewSnapshot(latestSnapshot)
                .elements(elements)
                .participants(List.of())
                .build();
    }
}