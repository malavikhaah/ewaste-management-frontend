package com.ewaste.controller;

import com.ewaste.dto.ProfileUpdateRequest;
import com.ewaste.entity.User;
import com.ewaste.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private static final String PHONE_REGEX = "^[6-9]\\d{9}$";

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return Map.of(
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone()
        );
    }

    @PutMapping("/update")
    public Map<String, String> update(Authentication authentication,
                                      @RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String phone = request.getPhone().trim();
            if (!phone.matches(PHONE_REGEX)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter valid 10-digit phone number");
            }
            user.setPhone(phone);
        }
        userRepository.save(user);
        return Map.of("message", "Profile updated");
    }
}
