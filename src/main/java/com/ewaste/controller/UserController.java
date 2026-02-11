package com.ewaste.controller;

import com.ewaste.dto.AuthResponse;
import com.ewaste.dto.EmailRequest;
import com.ewaste.dto.LoginRequest;
import com.ewaste.dto.OtpVerifyRequest;
import com.ewaste.dto.RegisterRequest;
import com.ewaste.service.UserService;

import jakarta.validation.Valid;   // ✅ ADDED IMPORT

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    // ✅ VALIDATION ENABLED HERE
    @PostMapping("/register")
    public Map<String, String> registerUser(
            @Valid @RequestBody RegisterRequest request) {

        String message = service.registerUser(request);
        return Map.of("message", message);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody OtpVerifyRequest request) {
        String token = service.verifyOtp(
                request.getEmail(),
                request.getOtp()
        );
        return new AuthResponse("Registration successful", token);
    }

    @PostMapping("/login/request-otp")
    public Map<String, String> requestLoginOtp(
            @RequestBody EmailRequest request) {

        String message = service.requestLoginOtp(
                request.getEmail()
        );
        return Map.of("message", message);
    }

    @PostMapping("/login/verify-otp")
    public AuthRespo
