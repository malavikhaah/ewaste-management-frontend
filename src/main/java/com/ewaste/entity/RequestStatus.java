package com.ewaste.entity;

public enum RequestStatus {
    SUBMITTED,
    PENDING,
    ACCEPTED,
    REJECTED,                                                                                                                                                                                            
    SCHEDULED,
    PICKUP_SCHEDULED,
    PICKED_UP

    ;

    public static RequestStatus fromInput(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }
        String normalized = value.trim().toUpperCase();
        if ("PICKUP_SCHEDULED".equals(normalized)) {
            return PICKUP_SCHEDULED;
        }
        if ("SUBMITTED".equals(normalized)) {
            return SUBMITTED;
        }
        return RequestStatus.valueOf(normalized);
    }

    public boolean isScheduledState() {
        return this == SCHEDULED || this == PICKUP_SCHEDULED;
    }

    public boolean isPendingState() {
        return this == PENDING || this == SUBMITTED;
    }
}
