package com.ewaste.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AdminRequestUpdateRequest {

    private String status;
    private LocalDate pickupDate;
    private LocalTime pickupTime;
    private String pickupPersonnelName;
    private String rejectionReason;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(LocalDate pickupDate) {
        this.pickupDate = pickupDate;
    }

    public LocalTime getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(LocalTime pickupTime) {
        this.pickupTime = pickupTime;
    }

    public String getPickupPersonnelName() {
        return pickupPersonnelName;
    }

    public void setPickupPersonnelName(String pickupPersonnelName) {
        this.pickupPersonnelName = pickupPersonnelName;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
