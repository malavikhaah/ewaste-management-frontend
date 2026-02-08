package com.ewaste.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public void sendOtpEmail(String toEmail, String otp) {
        if (!mailEnabled) {
            System.out.println("DEV OTP for " + toEmail + ": " + otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("E-Waste System Email Verification OTP");
        message.setText("Your OTP for email verification is: " + otp + "\nIt is valid for 5 minutes.");

        mailSender.send(message);
    }
}
