package com.whiteboard.repository;

import com.whiteboard.model.VersionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VersionHistoryRepository
        extends JpaRepository<VersionHistory, Long> {

    List<VersionHistory> findByRoomCodeOrderByTimestampDesc(String roomCode);
}