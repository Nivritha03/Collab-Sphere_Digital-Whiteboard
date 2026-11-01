package com.whiteboard.service;

import com.whiteboard.model.*;
import com.whiteboard.repository.RoomMembershipRepository;
import com.whiteboard.repository.RoomRepository;
import com.whiteboard.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public RoomService(RoomRepository roomRepository,
                       RoomMembershipRepository membershipRepository,
                       UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    public Room createRoom(String customName, String creatorEmail) {
        return createRoom(customName, null, creatorEmail);
    }

    public Room createRoom(String customName, String customCode, String creatorEmail) {
        String cleanName = (customName != null && !customName.trim().isEmpty()) 
                ? customName.trim() 
                : "Collaborative Whiteboard";

        String roomCode;
        if (customCode != null && !customCode.trim().isEmpty()) {
            roomCode = customCode.trim().toUpperCase();
        } else {
            roomCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Room room = Room.builder()
                .code(roomCode)
                .name(cleanName)
                .createdBy(creatorEmail != null && !creatorEmail.trim().isEmpty() ? creatorEmail.trim() : "anonymous")
                .createdAt(LocalDateTime.now())
                .lastAccessedAt(LocalDateTime.now())
                .isActive(true)
                .users(new HashSet<>())
                .build();

        Room savedRoom = roomRepository.save(room);

        // If authenticated user created it, add them as persistent member immediately
        if (creatorEmail != null) {
            userRepository.findByEmail(creatorEmail).ifPresent(user -> {
                joinRoom(savedRoom.getCode(), user);
            });
        }

        return savedRoom;
    }

    public Room getOrCreateRoom(String roomCode, String optionalName, String userEmail) {
        return roomRepository.findByCode(roomCode).orElseGet(() -> {
            Room newRoom = Room.builder()
                    .code(roomCode)
                    .name(optionalName != null && !optionalName.trim().isEmpty() ? optionalName.trim() : "Board #" + roomCode.substring(0, Math.min(6, roomCode.length())))
                    .createdBy(userEmail != null ? userEmail : "guest")
                    .createdAt(LocalDateTime.now())
                    .lastAccessedAt(LocalDateTime.now())
                    .isActive(true)
                    .users(new HashSet<>())
                    .build();
            return roomRepository.save(newRoom);
        });
    }

    public RoomMembership joinRoom(String roomCode, User user) {
        Room room = getOrCreateRoom(roomCode, null, user.getEmail());
        room.setLastAccessedAt(LocalDateTime.now());
        roomRepository.save(room);

        return membershipRepository.findByUserAndRoom(user, room).map(existing -> {
            existing.setLastAccessedAt(LocalDateTime.now());
            existing.setHasExited(false);
            existing.setOnline(true);
            return membershipRepository.save(existing);
        }).orElseGet(() -> {
            RoomMembership rm = RoomMembership.builder()
                    .user(user)
                    .room(room)
                    .joinedAt(LocalDateTime.now())
                    .lastAccessedAt(LocalDateTime.now())
                    .hasExited(false)
                    .isOnline(true)
                    .build();
            return membershipRepository.save(rm);
        });
    }

    public void exitRoom(String roomCode, String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            roomRepository.findByCode(roomCode).ifPresent(room -> {
                membershipRepository.findByUserAndRoom(user, room).ifPresent(rm -> {
                    rm.setHasExited(true);
                    rm.setOnline(false);
                    rm.setLastAccessedAt(LocalDateTime.now());
                    membershipRepository.save(rm);
                });
            });
        });
    }

    public void deleteRoomHistory(String roomCode, String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            roomRepository.findByCode(roomCode).ifPresent(room -> {
                // If user is creator, they can delete the room and its records
                if (room.getCreatedBy().equalsIgnoreCase(userEmail)) {
                    membershipRepository.deleteByRoomCode(roomCode);
                    roomRepository.delete(room);
                } else {
                    // Otherwise remove membership record for this user
                    membershipRepository.deleteByUserAndRoom(user, room);
                }
            });
        });
    }

    public List<RoomSummaryDTO> getUserRoomHistory(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return Collections.emptyList();
        }
        final String cleanEmail = userEmail.trim();

        // 1. Gather all rooms the user has memberships in
        List<RoomMembership> memberships = membershipRepository.findAllByUserEmailOrderByLastAccessedAtDesc(cleanEmail);
        Map<String, RoomMembership> membershipByCode = new HashMap<>();
        for (RoomMembership m : memberships) {
            if (m.getRoom() != null && m.getRoom().getCode() != null) {
                membershipByCode.put(m.getRoom().getCode(), m);
            }
        }

        // 2. Also gather any rooms created by this user
        List<Room> createdRooms = roomRepository.findByCreatedByOrderByCreatedAtDesc(cleanEmail);

        // 3. Merge all unique rooms
        Map<String, Room> allRoomsMap = new LinkedHashMap<>();
        for (Room r : createdRooms) {
            allRoomsMap.put(r.getCode(), r);
        }
        for (RoomMembership m : memberships) {
            if (m.getRoom() != null) {
                allRoomsMap.putIfAbsent(m.getRoom().getCode(), m.getRoom());
            }
        }

        // 4. Transform into accurate RoomSummaryDTO with live participants
        return allRoomsMap.values().stream().map(room -> {
            RoomMembership userMem = membershipByCode.get(room.getCode());
            List<RoomMembership> allMembers = membershipRepository.findByRoomCode(room.getCode());
            
            Set<String> participantNames = new LinkedHashSet<>();
            if (room.getCreatedBy() != null && !room.getCreatedBy().equalsIgnoreCase("anonymous")) {
                userRepository.findByEmail(room.getCreatedBy())
                        .ifPresent(u -> participantNames.add(u.getUsername()));
            }

            for (RoomMembership rm : allMembers) {
                if (rm.getUser() != null && rm.getUser().getUsername() != null) {
                    participantNames.add(rm.getUser().getUsername());
                }
            }

            LocalDateTime joinedAt = userMem != null ? userMem.getJoinedAt() : room.getCreatedAt();
            LocalDateTime lastAccessed = userMem != null ? userMem.getLastAccessedAt() : room.getLastAccessedAt();
            boolean hasExited = userMem != null ? userMem.isHasExited() : false;

            return RoomSummaryDTO.builder()
                    .roomCode(room.getCode())
                    .roomName(room.getName() != null ? room.getName() : "Board #" + room.getCode())
                    .createdBy(room.getCreatedBy())
                    .joinedAt(joinedAt != null ? joinedAt.format(FORMATTER) : "Recently")
                    .lastAccessedAt(lastAccessed != null ? lastAccessed.format(FORMATTER) : "Recently")
                    .participantCount(Math.max(1, participantNames.size()))
                    .isActive(room.isActive())
                    .hasExited(hasExited)
                    .participants(new ArrayList<>(participantNames))
                    .build();
        }).sorted((a, b) -> {
            try {
                LocalDateTime dtA = LocalDateTime.parse(a.getLastAccessedAt(), FORMATTER);
                LocalDateTime dtB = LocalDateTime.parse(b.getLastAccessedAt(), FORMATTER);
                return dtB.compareTo(dtA);
            } catch (Exception e) {
                return 0;
            }
        }).collect(Collectors.toList());
    }

    public Optional<Room> findByCode(String code) {
        return roomRepository.findByCode(code);
    }
}
