package com.ewaste.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public void sendOtpEmail(String toEmail, String otp) {

        // If mail disabled → print OTP in console
        if (!mailEnabled) {
            System.out.println("DEV OTP for " + toEmail + ": " + otp);
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("♻️ Smart E-Waste Management — Email Verification OTP");

            // 🌿 HTML EMAIL TEMPLATE
            String body = """
                <html>
                <body style="font-family: Arial, sans-serif;
                             background-color:#f4f6f8;
                             padding:20px;">

                    <div style="
                        max-width:600px;
                        margin:auto;
                        background:white;
                        border-radius:10px;
                        padding:30px;
                        box-shadow:0 0 10px rgba(0,0,0,0.1);">

                        <h2 style="
                            color:#2e7d32;
                            text-align:center;">
                            ♻️ Smart E-Waste Management
                        </h2>

                        <p>Hello User,</p>

                        <p>
                            Thank you for registering with the
                            <b>Smart E-Waste Collection & Management System</b>.
                        </p>

                        <p>
                            Please use the OTP below to verify your email:
                        </p>

                        <div style="
                            text-align:center;
                            margin:30px 0;">

                            <span style="
                                font-size:28px;
                                letter-spacing:5px;
                                background:#e8f5e9;
                                padding:15px 25px;
                                border-radius:8px;
                                color:#1b5e20;
                                font-weight:bold;">
                                """ + otp + """
                            </span>
                        </div>

                        <p>
                            This OTP is valid for <b>5 minutes</b>.
                        </p>

                        <p>
                            If you did not request this,
                            please ignore this email.
                        </p>

                        <hr style="margin:30px 0;">

                        <p style="
                            font-size:12px;
                            color:gray;
                            text-align:center;">
                            © 2026 Smart E-Waste Management System <br>
                            Promoting Responsible Recycling 🌍
                        </p>

                    </div>
                </body>
                </html>
                """;

            // TRUE → send as HTML
            helper.setText(body, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendPickupScheduleEmail(
            String toEmail,
            Long requestId,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String personnelName
    ) {
        if (!mailEnabled) {
            System.out.printf("DEV MAIL pickup schedule -> %s | request=%d | %s %s | personnel=%s%n",
                    toEmail, requestId, pickupDate, pickupTime, personnelName);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject("E-Waste Pickup Scheduled");

            String body = """
                <html>
                <body style="font-family: Arial, sans-serif;">
                  <h3>Your e-waste pickup has been scheduled</h3>
                  <p>Request ID: <b>%d</b></p>
                  <p>Pickup Date: <b>%s</b></p>
                  <p>Pickup Time: <b>%s</b></p>
                  <p>Pickup Personnel: <b>%s</b></p>
                </body>
                </html>
                """.formatted(requestId, pickupDate, pickupTime, personnelName == null ? "TBD" : personnelName);

            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendStatusUpdateEmail(String toEmail, Long requestId, String status) {
        if (!mailEnabled) {
            System.out.printf("DEV MAIL status update -> %s | request=%d | status=%s%n", toEmail, requestId, status);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject("E-Waste Request Status Updated");

            String body = """
                <html>
                <body style="font-family: Arial, sans-serif;">
                  <h3>Your request status was updated</h3>
                  <p>Request ID: <b>%d</b></p>
                  <p>New Status: <b>%s</b></p>
                </body>
                </html>
                """.formatted(requestId, status);

            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}
