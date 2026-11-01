package com.whiteboard;

import com.whiteboard.model.*;
import com.whiteboard.service.AuthService;
import com.whiteboard.service.RoomService;
import com.whiteboard.service.WhiteboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DigitalWhiteboardApplicationTests {

    @Autowired
    private WhiteboardService whiteboardService;

    @Autowired
    private AuthService authService;

    @Autowired
    private RoomService roomService;

    @Test
    void contextLoads() {
    }

    @Test
    void testAuthSignUpAndSignIn() {
        String testEmail = "artist" + System.currentTimeMillis() + "@collabsphere.com";
        AuthDTOs.SignUpRequest signUpReq = new AuthDTOs.SignUpRequest();
        signUpReq.setUsername("CreativeArtist");
        signUpReq.setEmail(testEmail);
        signUpReq.setPassword("securePassword123");
        signUpReq.setColor("#8b5cf6");

        AuthDTOs.AuthResponse signUpRes = authService.signUp(signUpReq);
        assertNotNull(signUpRes);
        assertNotNull(signUpRes.getToken());
        assertEquals("CreativeArtist", signUpRes.getUsername());
        assertEquals(testEmail, signUpRes.getEmail());

        // Test Sign In
        AuthDTOs.SignInRequest signInReq = new AuthDTOs.SignInRequest();
        signInReq.setEmail(testEmail);
        signInReq.setPassword("securePassword123");

        AuthDTOs.AuthResponse signInRes = authService.signIn(signInReq);
        assertNotNull(signInRes);
        assertEquals(signUpRes.getUserId(), signInRes.getUserId());
    }

    @Test
    void testCustomNamedRoomAndMembershipHistory() {
        String email = "manager" + System.currentTimeMillis() + "@collabsphere.com";
        AuthDTOs.SignUpRequest req = new AuthDTOs.SignUpRequest();
        req.setUsername("ProjectManager");
        req.setEmail(email);
        req.setPassword("managerPass123");
        authService.signUp(req);

        // 1. Create Room with custom name
        Room room = roomService.createRoom("Q4 Architecture Sprint", email);
        assertNotNull(room);
        assertEquals("Q4 Architecture Sprint", room.getName());
        assertEquals(email, room.getCreatedBy());

        // 2. Query History
        List<RoomSummaryDTO> history = roomService.getUserRoomHistory(email);
        assertFalse(history.isEmpty());
        assertEquals("Q4 Architecture Sprint", history.get(0).getRoomName());
        assertFalse(history.get(0).isHasExited());

        // 3. Exit Room explicitly
        roomService.exitRoom(room.getCode(), email);
        List<RoomSummaryDTO> updatedHistory = roomService.getUserRoomHistory(email);
        assertTrue(updatedHistory.get(0).isHasExited());

        // 4. History is retained even after exit
        assertEquals(1, updatedHistory.size());
    }

    @Test
    void testWhiteboardElementPersistenceAndIsolation() {
        String room1 = "test-room-1-" + System.currentTimeMillis();
        String room2 = "test-room-2-" + System.currentTimeMillis();

        // Save element in room 1
        WhiteboardElement el1 = new WhiteboardElement();
        el1.setRoomCode(room1);
        el1.setTool("freehand");
        el1.setX0(100);
        el1.setY0(100);
        el1.setX1(200);
        el1.setY1(200);
        el1.setColor("#8b5cf6");
        el1.setSize(4);
        el1.setStrokeId("stroke-1");
        el1.setSenderId("user-1");
        el1.setIsFinished(true);

        whiteboardService.save(el1);

        // Verify room 1 has the element
        List<WhiteboardElement> room1Data = whiteboardService.getRoomData(room1);
        assertEquals(1, room1Data.size());
        assertEquals("stroke-1", room1Data.get(0).getStrokeId());

        // Verify room 2 does NOT have room 1's element
        List<WhiteboardElement> room2Data = whiteboardService.getRoomData(room2);
        assertTrue(room2Data.isEmpty());

        // Clear room 1
        whiteboardService.clearRoom(room1);
        assertTrue(whiteboardService.getRoomData(room1).isEmpty());
    }
}
