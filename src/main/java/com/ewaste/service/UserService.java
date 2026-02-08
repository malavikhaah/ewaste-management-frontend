package com.ewaste.service;

import com.ewaste.dto.RegisterRequest;
import com.ewaste.entity.PendingUser;
import com.ewaste.entity.User;
import com.ewaste.repository.PendingUserRepository;
import com.ewaste.repository.UserRepository;
import com.ewaste.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
@Service
public class UserService {

    private final UserRepository userRepo;
    private final PendingUserRepository pendingRepo;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public UserService(UserRepository userRepo,
                       PendingUserRepository pendingRepo,
                       EmailService emailService,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.pendingRepo = pendingRepo;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public String registerUser(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (userRepo.findByEmail(request.getEmail()) != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }
        PendingUser pending = pendingRepo.findByEmail(request.getEmail());
        String otp = generateOtp();
        if (pending == null) {
            pending = new PendingUser();
            pending.setEmail(request.getEmail());
        }
        pending.setName(request.getName());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            pending.setPassword(passwordEncoder.encode(request.getPassword()));
        } else {
            pending.setPassword(null);
        }
        pending.setPhone(request.getPhone());
        pending.setOtp(otp);
        pending.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        pendingRepo.save(pending);
        emailService.sendOtpEmail(pending.getEmail(), otp);
        return "OTP sent to email";
    }

    public String verifyOtp(String email, String otp) {
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and OTP are required");
        }
        PendingUser pending = pendingRepo.findByEmail(email);
        if (pending == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP not generated");
        }
        if (pending.getOtp() == null || pending.getOtpExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP not generated");
        }
        if (LocalDateTime.now().isAfter(pending.getOtpExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!otp.equals(pending.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        if (userRepo.findByEmail(email) != null) {
            pendingRepo.delete(pending);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }
        User user = new User();
        user.setName(pending.getName());
        user.setEmail(pending.getEmail());
        user.setPassword(pending.getPassword());
        user.setPhone(pending.getPhone());
        user.setIsVerified(true);
        userRepo.save(user);
        pendingRepo.delete(pending);
        return jwtService.generateToken(user.getEmail());
    }

    public String requestLoginOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        User user = userRepo.findByEmail(email);
        if (user == null || Boolean.FALSE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        }
        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepo.save(user);
        emailService.sendOtpEmail(user.getEmail(), otp);
        return "OTP sent to email";
    }

    public String verifyLoginOtp(String email, String otp) {
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and OTP are required");
        }
        User user = userRepo.findByEmail(email);
        if (user == null || Boolean.FALSE.equals(user.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        }
        if (user.getOtp() == null || user.getOtpExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP not generated");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!otp.equals(user.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        user.setOtp(null);
        user.setOtpExpiresAt(null);
        userRepo.save(user);
        return jwtService.generateToken(user.getEmail());
    }

    private String generateOtp() {
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }
}
