package com.ewaste.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ewaste.dto.EwasteRequestSummary;
import com.ewaste.service.EwasteRequestService;

@RestController
@RequestMapping("/requests")
public class EwasteRequestController {

    private final EwasteRequestService requestService;

    public EwasteRequestController(EwasteRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EwasteRequestSummary submitRequest(
            Authentication authentication,
            @RequestParam String deviceType,
            @RequestParam String brand,
            @RequestParam String model,
            @RequestParam String condition,
            @RequestParam Integer quantity,
            @RequestParam String pickupAddress,
            @RequestParam(required = false) String additionalRemarks,
            @RequestPart("images") MultipartFile[] images
    ) {
        return requestService.createRequest(
                authentication.getName(),
                deviceType,
                brand,
                model,
                condition,
                quantity,
                pickupAddress,
                additionalRemarks,
                images
        );
    }

    @GetMapping("/mine")
    public List<EwasteRequestSummary> myRequests(Authentication authentication) {
        return requestService.getMyRequests(authentication.getName());
    }

    @GetMapping("/{id}")
    public EwasteRequestSummary requestById(Authentication authentication, @PathVariable Long id) {
        return requestService.getRequestById(authentication.getName(), id);
    }

    @PostMapping(value = "/{id}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EwasteRequestSummary updateRequest(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam String deviceType,
            @RequestParam String brand,
            @RequestParam String model,
            @RequestParam String condition,
            @RequestParam Integer quantity,
            @RequestParam String pickupAddress,
            @RequestParam(required = false) String additionalRemarks,
            @RequestPart(value = "images", required = false) MultipartFile[] images
    ) {
        return requestService.updateRequest(
                authentication.getName(),
                id,
                deviceType,
                brand,
                model,
                condition,
                quantity,
                pickupAddress,
                additionalRemarks,
                images
        );
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> requestImage(Authentication authentication, @PathVariable Long id) {

        EwasteRequestService.RequestImageData imageData =
                requestService.getRequestImageById(authentication.getName(), id);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        try {
            mediaType = MediaType.parseMediaType(imageData.contentType());
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(imageData.data());
    }

    @GetMapping("/{id}/image-data")
    public EwasteRequestService.RequestImagePayload requestImageData(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return requestService.getRequestImagePayloadById(authentication.getName(), id);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteRequest(Authentication authentication, @PathVariable Long id) {

        requestService.deleteRequest(authentication.getName(), id);

        return Map.of("message", "Request deleted successfully");
    }
}