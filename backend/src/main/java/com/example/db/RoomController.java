package com.example.db;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:3000")
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public Room createRoom(@RequestBody String creatorId) {
        return roomService.createRoom(creatorId);
    }

    @PostMapping("/{code}/join")
    public Room joinRoom(@PathVariable String code, @RequestBody String memberId) {
        return roomService.joinRoom(code, memberId);
    }

    @GetMapping("/{code}/permissions")
    public boolean checkPermissions(@PathVariable String code, @RequestBody String userId) {
        return roomService.checkPermissions(code, userId);
    }

    @DeleteMapping("/{roomId}")
    public void deleteRoom(@PathVariable String roomId) {
        System.out.println("Deleting room with id: " + roomId);
        roomService.deleteRoom(roomId);
    }

    @PostMapping("/join")
    public ResponseEntity<Room> joinRoom(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String memberId = body.get("memberId");
        Room room = roomService.joinRoom(code, memberId);
        return ResponseEntity.ok(room);
    }

    @GetMapping
    public List<Room> getAllRooms() {
        return roomService.getAllRooms();
    }
}