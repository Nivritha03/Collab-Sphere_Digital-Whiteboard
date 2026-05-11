package com.whiteboard.service;

import com.whiteboard.model.VersionHistory;
import com.whiteboard.repository.VersionHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VersionHistoryService {

    private final VersionHistoryRepository repo;

    public VersionHistoryService(VersionHistoryRepository repo) {
        this.repo = repo;
    }

    public void saveSnapshot(VersionHistory v) {
        repo.save(v);
    }

    public List<VersionHistory> getHistory(String room) {
        return repo.findByRoomCodeOrderByTimestampDesc(room);
    }
}