package com.example.db;

import graphql.kickstart.tools.GraphQLQueryResolver;
import org.springframework.stereotype.Component;

@Component
public class RoomQueryResolver implements GraphQLQueryResolver {
    private final RoomRepository roomRepository;

    public RoomQueryResolver(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Iterable<Room> getAllRooms() {
        return roomRepository.findAll();
    }
}