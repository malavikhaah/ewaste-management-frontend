package com.ewaste.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.ewaste.dto.EwasteRequestSummary;
import com.ewaste.entity.EwasteRequest;
import com.ewaste.entity.RequestCondition;
import com.ewaste.entity.RequestStatus;
import com.ewaste.entity.User;
import com.ewaste.repository.EwasteRequestRepository;
import com.ewaste.repository.UserRepository;

@Service
public class EwasteRequestService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;

    private final EwasteRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public EwasteRequestService(
            EwasteRequestRepository requestRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public EwasteRequestSummary createRequest(
            String email,
            String deviceType,
            String brand,
            String model,
            String condition,
            Integer quantity,
            String pickupAddress,
            String additionalRemarks,
            MultipartFile[] images
    ) {

        User user = getUserByEmail(email);

        validateRequestInput(deviceType, brand, model, condition, quantity, pickupAddress, images);

        EwasteRequest request = new EwasteRequest();

        request.setUser(user);
        request.setDeviceType(deviceType.trim());
        request.setBrand(brand.trim());
        request.setModel(model.trim());
        request.setCondition(parseCondition(condition));
        request.setQuantity(quantity);
        request.setPickupAddress(pickupAddress.trim());
        request.setAdditionalRemarks(additionalRemarks == null ? null : additionalRemarks.trim());

        List<String> imageList = new ArrayList<>();
        List<String> typeList = new ArrayList<>();

        try {

            for (MultipartFile image : images) {

                if (image == null || image.isEmpty()) continue;

                String base64 = Base64.getEncoder().encodeToString(image.getBytes());

                imageList.add(base64);

                typeList.add(
                        image.getContentType() == null
                                ? "application/octet-stream"
                                : image.getContentType()
                );
            }

        } catch (IOException exception) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded images");

        }

        request.setImages(imageList);
        request.setImageContentTypes(typeList);

        EwasteRequest saved = requestRepository.save(request);

        return toSummary(saved);
    }

    public List<EwasteRequestSummary> getMyRequests(String email) {

        User user = getUserByEmail(email);

        return requestRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public List<EwasteRequestSummary> getAllRequests() {

        return requestRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(EwasteRequest::getCreatedAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    public EwasteRequestSummary getRequestById(String email, Long requestId) {

        User user = getUserByEmail(email);

        EwasteRequest request = requestRepository.findByIdAndUser(requestId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        return toSummary(request);
    }

    public EwasteRequestSummary updateRequest(
            String email,
            Long requestId,
            String deviceType,
            String brand,
            String model,
            String condition,
            Integer quantity,
            String pickupAddress,
            String additionalRemarks,
            MultipartFile[] images
    ) {

        User user = getUserByEmail(email);

        EwasteRequest request = requestRepository.findByIdAndUser(requestId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (!request.getStatus().isPendingState()) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending requests can be updated");

        }

        validateUpdateInput(deviceType, brand, model, condition, quantity, pickupAddress, images);

        request.setDeviceType(deviceType.trim());
        request.setBrand(brand.trim());
        request.setModel(model.trim());
        request.setCondition(parseCondition(condition));
        request.setQuantity(quantity);
        request.setPickupAddress(pickupAddress.trim());
        request.setAdditionalRemarks(additionalRemarks == null ? null : additionalRemarks.trim());

        if (images != null && images.length > 0) {

            List<String> imageList = new ArrayList<>();
            List<String> typeList = new ArrayList<>();

            try {

                for (MultipartFile image : images) {

                    if (image == null || image.isEmpty()) continue;

                    String base64 = Base64.getEncoder().encodeToString(image.getBytes());

                    imageList.add(base64);

                    typeList.add(
                            image.getContentType() == null
                                    ? "application/octet-stream"
                                    : image.getContentType()
                    );
                }

            } catch (IOException exception) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image");

            }

            request.setImages(imageList);
            request.setImageContentTypes(typeList);
        }

        EwasteRequest saved = requestRepository.save(request);

        return toSummary(saved);
    }

    /* ---------- ADMIN UPDATE METHOD ---------- */

    public EwasteRequestSummary adminUpdateRequest(
            Long requestId,
            RequestStatus status,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String pickupPersonnelName,
            String rejectionReason
    ) {

        EwasteRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (status == RequestStatus.REJECTED) {

            request.setStatus(RequestStatus.REJECTED);
            request.setRejectionReason(rejectionReason);
            request.setPickupDate(null);
            request.setPickupTime(null);
            request.setPickupPersonnelName(null);

        } else if (status.isScheduledState()) {

            if (pickupDate == null || pickupTime == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pickupDate and pickupTime required");
            }

            request.setStatus(RequestStatus.SCHEDULED);
            request.setPickupDate(pickupDate);
            request.setPickupTime(pickupTime);
            request.setPickupPersonnelName(pickupPersonnelName);
            request.setRejectionReason(null);

        } else {

            request.setStatus(status);
        }

        EwasteRequest saved = requestRepository.save(request);

        return toSummary(saved);
    }

    public RequestImageData getRequestImageById(String email, Long requestId) {

        User user = getUserByEmail(email);

        EwasteRequest request = requestRepository.findByIdAndUser(requestId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (request.getImages() == null || request.getImages().isEmpty()) {

            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request image not found");

        }

        byte[] imageBytes = Base64.getDecoder().decode(request.getImages().get(0));

        return new RequestImageData(
                request.getImageContentTypes().get(0),
                imageBytes
        );
    }

    public RequestImagePayload getRequestImagePayloadById(String email, Long requestId) {

        RequestImageData imageData = getRequestImageById(email, requestId);

        String base64 = Base64.getEncoder().encodeToString(imageData.data());

        return new RequestImagePayload(imageData.contentType(), base64);
    }

    public RequestImagePayload getAdminRequestImagePayloadById(Long requestId) {

        EwasteRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (request.getImages() == null || request.getImages().isEmpty()) {

            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request image not found");

        }

        return new RequestImagePayload(
                request.getImageContentTypes().get(0),
                request.getImages().get(0)
        );
    }

    public void deleteRequest(String email, Long requestId) {

        User user = getUserByEmail(email);

        EwasteRequest request = requestRepository.findByIdAndUser(requestId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        requestRepository.delete(request);
    }

    /* ---------- VALIDATION METHODS ---------- */

    private void validateRequestInput(
            String deviceType,
            String brand,
            String model,
            String condition,
            Integer quantity,
            String pickupAddress,
            MultipartFile[] images
    ) {

        if (isBlank(deviceType) || isBlank(brand) || isBlank(model) || isBlank(condition) || isBlank(pickupAddress)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All required fields must be provided");
        }

        if (quantity == null || quantity < 1 || quantity > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be between 1 and 1000");
        }

        if (images == null || images.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image upload is required");
        }
    }

    private void validateUpdateInput(
            String deviceType,
            String brand,
            String model,
            String condition,
            Integer quantity,
            String pickupAddress,
            MultipartFile[] images
    ) {

        if (isBlank(deviceType) || isBlank(brand) || isBlank(model) || isBlank(condition) || isBlank(pickupAddress)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All required fields must be provided");
        }

        if (quantity == null || quantity < 1 || quantity > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be between 1 and 1000");
        }
    }

    private User getUserByEmail(String email) {

        User user = userRepository.findByEmail(email);

        if (user == null) {

            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");

        }

        return user;
    }

    private RequestCondition parseCondition(String value) {

        try {

            return RequestCondition.valueOf(value.trim().toUpperCase());

        } catch (IllegalArgumentException exception) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid condition value");

        }
    }

    private boolean isBlank(String value) {

        return value == null || value.isBlank();

    }

    private EwasteRequestSummary toSummary(EwasteRequest request) {

        return new EwasteRequestSummary(
                request.getId(),
                request.getDeviceType(),
                request.getBrand(),
                request.getModel(),
                request.getCondition(),
                request.getQuantity(),
                request.getPickupAddress(),
                request.getAdditionalRemarks(),
                request.getStatus(),
                request.getPickupDate(),
                request.getPickupTime(),
                request.getPickupPersonnelName(),
                request.getRejectionReason(),
                request.getUser() == null ? null : request.getUser().getName(),
                request.getUser() == null ? null : request.getUser().getEmail(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }

    public record RequestImageData(String contentType, byte[] data) {}

    public record RequestImagePayload(String contentType, String base64Data) {}
}