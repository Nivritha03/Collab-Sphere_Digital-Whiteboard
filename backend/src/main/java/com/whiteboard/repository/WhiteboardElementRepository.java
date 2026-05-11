package com.whiteboard.repository;

import com.whiteboard.model.WhiteboardElement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WhiteboardElementRepository
        extends JpaRepository<WhiteboardElement, Long> {

    List<WhiteboardElement> findByRoomCode(String roomCode);

    void deleteByRoomCode(String roomCode);
}