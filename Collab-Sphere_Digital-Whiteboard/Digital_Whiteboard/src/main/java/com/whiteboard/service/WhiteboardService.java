package com.whiteboard.service;

import com.whiteboard.model.WhiteboardElement;
import com.whiteboard.repository.WhiteboardElementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WhiteboardService {

    private final WhiteboardElementRepository repo;

    public WhiteboardService(WhiteboardElementRepository repo) {
        this.repo = repo;
    }

    public WhiteboardElement save(WhiteboardElement element) {
        return repo.save(element);
    }

    public List<WhiteboardElement> getRoomData(String roomCode) {
        return repo.findByRoomCode(roomCode);
    }

    public void clearRoom(String roomCode) {
        repo.deleteByRoomCode(roomCode);
    }
}