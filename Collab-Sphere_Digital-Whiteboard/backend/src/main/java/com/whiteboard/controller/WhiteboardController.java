package com.whiteboard.controller;

import com.whiteboard.model.WhiteboardElement;
import com.whiteboard.service.WhiteboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/whiteboard")
public class WhiteboardController {

    private final WhiteboardService service;

    public WhiteboardController(WhiteboardService service) {
        this.service = service;
    }

    @GetMapping("/{room}")
    public List<WhiteboardElement> getBoard(@PathVariable String room) {
        return service.getRoomData(room);
    }
}