package com.whiteboard.websocket;

import com.whiteboard.model.WhiteboardElement;
import com.whiteboard.service.WhiteboardService;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.whiteboard.model.VersionHistory;
import com.whiteboard.service.VersionHistoryService;

import java.util.HashMap;
import java.util.Map;

@Controller
public class WhiteboardWebSocketController {

    private final SimpMessagingTemplate template;
    private final VersionHistoryService versionHistoryService;

    public WhiteboardWebSocketController(SimpMessagingTemplate template,
                                         WhiteboardService service,
                                         VersionHistoryService versionHistoryService) {
        this.template = template;
        this.versionHistoryService = versionHistoryService;
    }

    // ✅ DRAW
    @MessageMapping("/draw/{room}")
    public void draw(@DestinationVariable String room,
                     WhiteboardElement element) {

        template.convertAndSend(
                "/topic/whiteboard/" + room,
                element
        );
    }

    // ✅ CURSOR
    @MessageMapping("/cursor/{room}")
    public void cursor(@DestinationVariable String room,
                       Object cursor) {

        template.convertAndSend("/topic/cursor/" + room, cursor);
    }

    // ✅ UNDO
    @MessageMapping("/room/{room}/undo")
    public void undo(@DestinationVariable String room, String userId) {
        template.convertAndSend("/topic/undo/" + room, userId);
    }

    // ✅ REDO
    @MessageMapping("/room/{room}/redo")
    public void redo(@DestinationVariable String room, String userId) {
        template.convertAndSend("/topic/redo/" + room, userId);
    }

    // ✅ CLEAR (FIXED VERSION)
    @MessageMapping("/room/{room}/clear")
    public void clear(@DestinationVariable String room,
                      @Payload Map<String, Object> payload) {

        template.convertAndSend(
            "/topic/clear/" + room,
            (Object) payload   // 🔥 THIS FIXES AMBIGUITY
        );
    }

    // ✅ PRESENCE (JOIN / HEARTBEAT)
    @MessageMapping("/presence/{room}")
    public void presence(@DestinationVariable String room,
                         Object payload) {

        template.convertAndSend(
                "/topic/presence/" + room,
                payload
        );
    }

    // ✅ SAVE VERSION HISTORY
    @MessageMapping("/save/{room}")
    public void save(@DestinationVariable String room, String snapshot) {

        VersionHistory v = new VersionHistory();
        v.setRoomCode(room);
        v.setSnapshot(snapshot);
        v.setTimestamp(System.currentTimeMillis());

        versionHistoryService.saveSnapshot(v);
    }
}