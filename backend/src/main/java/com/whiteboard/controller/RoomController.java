package com.whiteboard.controller;

import com.whiteboard.model.Room;
import com.whiteboard.model.RoomSummaryDTO;
import com.whiteboard.model.User;
import com.whiteboard.service.AuthService;
import com.whiteboard.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;
    private final AuthService authService;

    public RoomController(RoomService roomService, AuthService authService) {
        this.roomService = roomService;
        this.authService = authService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String customCode = body.get("code") != null ? body.get("code") : body.get("roomCode");
        String email = body.get("email") != null ? body.get("email") : body.get("createdBy");

        Room room = roomService.createRoom(name, customCode, email);
        return ResponseEntity.ok(Map.of(
                "code", room.getCode(),
                "roomCode", room.getCode(),
                "name", room.getName(),
                "createdBy", room.getCreatedBy(),
                "createdAt", room.getCreatedAt().toString()
        ));
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody Map<String, String> body) {
        String roomCode = body.get("roomCode") != null ? body.get("roomCode") : body.get("code");
        String email = body.get("email") != null ? body.get("email") : body.get("userEmail");

        if (roomCode == null || roomCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room code is required"));
        }

        User user = (email != null && !email.trim().isEmpty()) 
                ? authService.findByEmail(email).orElse(null)
                : null;

        if (user != null) {
            roomService.joinRoom(roomCode, user);
        }

        Room room = roomService.getOrCreateRoom(roomCode, null, email);
        return ResponseEntity.ok(Map.of(
                "code", room.getCode(),
                "roomCode", room.getCode(),
                "name", room.getName(),
                "createdBy", room.getCreatedBy()
        ));
    }

    @GetMapping("/history")
    public ResponseEntity<List<RoomSummaryDTO>> getHistory(@RequestParam String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<RoomSummaryDTO> history = roomService.getUserRoomHistory(email.trim());
        return ResponseEntity.ok(history);
    }

    @PostMapping("/exit")
    public ResponseEntity<?> exitRoom(@RequestBody Map<String, String> body) {
        String roomCode = body.get("roomCode");
        String email = body.get("email");

        if (roomCode != null && email != null) {
            roomService.exitRoom(roomCode, email);
        }
        return ResponseEntity.ok(Map.of("status", "exited"));
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> deleteHistory(@RequestParam String roomCode, @RequestParam String email) {
        if (roomCode != null && email != null) {
            roomService.deleteRoomHistory(roomCode, email);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "roomCode and email required"));
    }
}
