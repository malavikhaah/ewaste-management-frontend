package com.ewaste.dto;

import com.ewaste.entity.RequestCondition;
import com.ewaste.entity.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class EwasteRequestSummary {
    private Long id;
    private String deviceType;
    private String brand;
    private String model;
    private RequestCondition condition;
    private Integer quantity;
    private String pickupAddress;
    private String additionalRemarks;
    private RequestStatus status;
    private LocalDate pickupDate;
    private LocalTime pickupTime;
    private String pickupPersonnelName;
    private String rejectionReason;
    private String requesterName;
    private String requesterEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
