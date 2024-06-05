package com.example.db;

import org.springframework.context.ApplicationEvent;

public class CreatorLeavesRoomEvent extends ApplicationEvent {
    private final String roomId;

    public CreatorLeavesRoomEvent(Object source, String roomId) {
        super(source);
        this.roomId = roomId;
    }

    public String getRoomId() {
        return roomId;
    }
}
