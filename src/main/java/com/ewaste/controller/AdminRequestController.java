package com.ewaste.controller;

import com.ewaste.dto.AdminRequestUpdateRequest;
import com.ewaste.dto.EwasteRequestSummary;
import com.ewaste.entity.RequestStatus;
import com.ewaste.service.EwasteRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/admin/requests")
public class AdminRequestController {

    private final EwasteRequestService requestService;

    public AdminRequestController(EwasteRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public List<EwasteRequestSummary> allRequests() {
        return requestService.getAllRequests();
    }

    @GetMapping("/{id}/image-data")
    public EwasteRequestService.RequestImagePayload requestImageData(@PathVariable Long id) {
        return requestService.getAdminRequestImagePayloadById(id);
    }

    @PutMapping("/{id}")
    public EwasteRequestSummary updateRequest(
            @PathVariable Long id,
            @RequestBody AdminRequestUpdateRequest request
    ) {
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        RequestStatus status;
        try {
            status = RequestStatus.fromInput(request.getStatus());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
        }

        return requestService.adminUpdateRequest(
                id,
                status,
                request.getPickupDate(),
                request.getPickupTime(),
                request.getPickupPersonnelName(),
                request.getRejectionReason()
        );
    }
}
