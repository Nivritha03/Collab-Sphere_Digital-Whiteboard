package com.whiteboard.repository;

import com.whiteboard.model.RoomMembership;
import com.whiteboard.model.User;
import com.whiteboard.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomMembershipRepository extends JpaRepository<RoomMembership, Long> {
    
    Optional<RoomMembership> findByUserAndRoom(User user, Room room);
    
    @Query("SELECT rm FROM RoomMembership rm WHERE rm.user.email = :email ORDER BY rm.lastAccessedAt DESC")
    List<RoomMembership> findAllByUserEmailOrderByLastAccessedAtDesc(@Param("email") String email);

    @Query("SELECT rm FROM RoomMembership rm WHERE rm.room.code = :roomCode")
    List<RoomMembership> findByRoomCode(@Param("roomCode") String roomCode);

    void deleteByRoomCode(String roomCode);

    void deleteByUserAndRoom(User user, Room room);
}
