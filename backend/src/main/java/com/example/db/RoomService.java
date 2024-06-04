
package com.example.db;

import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import java.util.Random;

@Service
public class RoomService {
    private final RoomRepository roomRepository;
    private final Random random = new Random();
    private final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    @Autowired
    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room createRoom() {
        String code = generateRandomCode(4);
        Room room = new Room();
        room.setCode(code);
        return roomRepository.save(room);
    }

    private String generateRandomCode(int length) {
        StringBuilder code = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
}