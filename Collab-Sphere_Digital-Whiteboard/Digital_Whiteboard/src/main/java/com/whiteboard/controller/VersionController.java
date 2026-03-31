package com.whiteboard.controller;

import com.whiteboard.model.VersionHistory;
import com.whiteboard.service.VersionHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final VersionHistoryService service;

    public VersionController(VersionHistoryService service) {
        this.service = service;
    }

    @GetMapping("/{room}")
    public List<VersionHistory> getHistory(@PathVariable String room) {
        return service.getHistory(room);
    }
}