package com.ewaste.controller;

import com.ewaste.entity.EwasteRequest;
import com.ewaste.entity.RequestStatus;
import com.ewaste.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // 1️⃣ Get all requests
    @GetMapping("/requests")
    public List<EwasteRequest> getAllRequests() {
        return adminService.getAllRequests();
    }

    // 2️⃣ Accept or Reject a request
    @PutMapping("/requests/{id}/status")
    public ResponseEntity<EwasteRequest> updateRequestStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        RequestStatus requestStatus = RequestStatus.valueOf(status.toUpperCase());
        EwasteRequest updatedRequest = adminService.updateRequestStatus(id, requestStatus);
        return ResponseEntity.ok(updatedRequest);
    }

    // 3️⃣ Schedule Pickup
    @PutMapping("/requests/{id}/schedule")
    public ResponseEntity<EwasteRequest> schedulePickup(
            @PathVariable Long id,
            @RequestParam String pickupDate,
            @RequestParam String pickupTime) {

        // Convert strings to LocalDate and LocalTime
        LocalDate date = LocalDate.parse(pickupDate); // format: yyyy-MM-dd
        LocalTime time = LocalTime.parse(pickupTime); // format: HH:mm

        EwasteRequest scheduledRequest = adminService.schedulePickup(id, date, time);
        return ResponseEntity.ok(scheduledRequest);
    }
}