package com.ewaste.service;

import com.ewaste.dto.RegisterRequest;
import com.ewaste.dto.ChangePasswordRequest;
import com.ewaste.dto.ResetPasswordRequest;
import com.ewaste.entity.PendingUser;
import com.ewaste.entity.User;
import com.ewaste.entity.UserRole;
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

    // ==========================
    // REGISTER + OTP
    // ==========================
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
        pending.setPhone(request.getPhone());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            pending.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        pending.setOtp(otp);
        pending.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        pendingRepo.save(pending);

        emailService.sendOtpEmail(pending.getEmail(), otp);

        return "OTP sent to email";
    }

    // ==========================
    // VERIFY OTP
    // ==========================
    public String verifyOtp(String email, String otp) {

        PendingUser pending = pendingRepo.findByEmail(email);

        if (pending == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP not generated");
        if (!otp.equals(pending.getOtp())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        if (LocalDateTime.now().isAfter(pending.getOtpExpiresAt()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");

        User user = new User();
        user.setName(pending.getName());
        user.setEmail(pending.getEmail());
        user.setPassword(pending.getPassword());
        user.setPhone(pending.getPhone());
        user.setIsVerified(true);
        user.setRole(UserRole.USER);

        userRepo.save(user);
        pendingRepo.delete(pending);

        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    // ==========================
    // LOGIN WITH PASSWORD
    // ==========================
    public String loginWithPassword(String email, String password) {

        User user = userRepo.findByEmail(email);

        if (user == null || Boolean.FALSE.equals(user.getIsVerified()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid credentials");

        return jwtService.generateToken(email, user.getRole().name());
    }

    // ==========================
    // LOGIN OTP REQUEST
    // ==========================
    public String requestLoginOtp(String email) {

        User user = userRepo.findByEmail(email);

        if (user == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepo.save(user);

        emailService.sendOtpEmail(email, otp);

        return "OTP sent to email";
    }

    // ==========================
    // LOGIN OTP VERIFY
    // ==========================
    public String verifyLoginOtp(String email, String otp) {

        User user = userRepo.findByEmail(email);

        if (user == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        if (!otp.equals(user.getOtp())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");

        user.setOtp(null);
        user.setOtpExpiresAt(null);
        userRepo.save(user);

        return jwtService.generateToken(email, user.getRole().name());
    }

    // ==========================
    // CHANGE PASSWORD
    // ==========================
    public String changePassword(ChangePasswordRequest request, String token) {

        String email = jwtService.extractUsername(token.replace("Bearer ", ""));
        User user = userRepo.findByEmail(email);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password incorrect");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        return "Password changed successfully";
    }

    // ==========================
    // FORGOT PASSWORD
    // ==========================
    public String forgotPassword(String email) {

        User user = userRepo.findByEmail(email);
        if (user == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email not registered");

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        userRepo.save(user);

        emailService.sendOtpEmail(email, otp);

        return "Reset OTP sent to email";
    }

    // ==========================
    // RESET PASSWORD
    // ==========================
    public String resetPassword(ResetPasswordRequest request) {

        User user = userRepo.findByEmail(request.getEmail());
        if (user == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found");
        if (!request.getOtp().equals(user.getOtp())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtp(null);
        user.setOtpExpiresAt(null);
        userRepo.save(user);

        return "Password reset successful";
    }

    // ==========================
    // OTP GENERATOR
    // ==========================
    private String generateOtp() {
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }
}
