package com.ewaste.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ewaste.entity.EwasteRequest;
import com.ewaste.entity.RequestStatus;
import com.ewaste.repository.EwasteRequestRepository;

@Service
public class AdminService {

    @Autowired
    private EwasteRequestRepository requestRepository;

    // 1️⃣ Get all requests (latest first)
    public List<EwasteRequest> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }

    // 2️⃣ Accept / Reject request
    public EwasteRequest updateRequestStatus(Long id, RequestStatus status) {
        EwasteRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(status);
        return requestRepository.save(request);
    }

    // 3️⃣ Schedule pickup
    public EwasteRequest schedulePickup(Long id, LocalDate pickupDate, LocalTime pickupTime) {
        EwasteRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setPickupDate(pickupDate);
        request.setPickupTime(pickupTime);
        request.setStatus(RequestStatus.SCHEDULED);

        return requestRepository.save(request);
    }
}