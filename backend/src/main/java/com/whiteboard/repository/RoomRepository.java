package com.whiteboard.repository;

import com.whiteboard.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findByCode(String code);
    List<Room> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    boolean existsByCode(String code);
}