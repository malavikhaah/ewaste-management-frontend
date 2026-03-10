package com.ewaste.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Locale;

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

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("♻️ Smart E-Waste Management — Email Verification OTP");

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

                        <p>Please use the OTP below to verify your email:</p>

                        <div style="text-align:center; margin:30px 0;">

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

                        <p>This OTP is valid for <b>5 minutes</b>.</p>

                        <p>If you did not request this, please ignore this email.</p>

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

            helper.setText(body, true);
            mailSender.send(message);

        } catch (MessagingException | MailException e) {
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
            System.out.printf(
                    "DEV MAIL pickup schedule -> %s | request=%d | %s %s | personnel=%s%n",
                    toEmail, requestId, pickupDate, pickupTime, personnelName
            );
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("E-Waste Pickup Scheduled");

            String content = """
                <p>Hello User,</p>

                <p>Your e-waste pickup has been successfully scheduled.</p>

                <div style="
                    background:#e8f5e9;
                    padding:15px;
                    border-radius:8px;
                    margin:20px 0;">

                    <p><b>Request ID:</b> #%d</p>
                    <p><b>Pickup Date:</b> %s</p>
                    <p><b>Pickup Time:</b> %s</p>
                    <p><b>Pickup Personnel:</b> %s</p>

                </div>

                <p>Please ensure the device is ready for pickup.</p>
                """.formatted(
                    requestId,
                    pickupDate,
                    pickupTime,
                    personnelName == null ? "To be assigned" : personnelName
            );

            String body = buildEmailTemplate("Pickup Scheduled", content);

            helper.setText(body, true);
            mailSender.send(message);

        } catch (MessagingException | MailException e) {
            e.printStackTrace();
        }
    }

    public void sendStatusUpdateEmail(String toEmail, Long requestId, String status) {

        if (!mailEnabled) {
            System.out.printf(
                    "DEV MAIL status update -> %s | request=%d | status=%s%n",
                    toEmail, requestId, status
            );
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String normalizedStatus =
                    status == null ? "PENDING" : status.trim().toUpperCase(Locale.ROOT);

            helper.setTo(toEmail);
            helper.setSubject("Smart E-Waste Management - " + statusHeadline(normalizedStatus));

            String content = """
                <p>Hello User,</p>

                <p>%s</p>

                <div style="
                    background:#e8f5e9;
                    padding:15px;
                    border-radius:8px;
                    margin:20px 0;">

                    <p><b>Request ID:</b> #%d</p>
                    <p><b>Status:</b> %s</p>

                </div>

                <p>%s</p>
                """.formatted(
                    statusMessage(normalizedStatus),
                    requestId,
                    titleCase(normalizedStatus),
                    nextStepText(normalizedStatus)
            );

            String body = buildEmailTemplate(
                    statusHeadline(normalizedStatus),
                    content
            );

            helper.setText(body, true);
            mailSender.send(message);

        } catch (MessagingException | MailException e) {
            e.printStackTrace();
        }
    }

    private String buildEmailTemplate(String title, String contentHtml) {

        return """
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

                    <h3 style="color:#1b5e20; text-align:center;">
                        %s
                    </h3>

                    %s

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
            """.formatted(title, contentHtml);
    }

    private String statusMessage(String status) {
        return switch (status) {
            case "ACCEPTED" -> "Great news. Your request has been accepted by our team.";
            case "REJECTED" -> "Your request could not be approved at this time.";
            case "SCHEDULED", "PICKUP_SCHEDULED" ->
                    "Your pickup has been planned and moved to scheduled state.";
            case "PICKED_UP" ->
                    "Pickup completed successfully. Thank you for recycling responsibly.";
            case "SUBMITTED", "PENDING" ->
                    "Your request is currently in review.";
            default ->
                    "There is an update on your e-waste pickup request.";
        };
    }

    private String nextStepText(String status) {
        return switch (status) {
            case "ACCEPTED" ->
                    "You will receive scheduling details shortly.";
            case "REJECTED" ->
                    "Please review request details and submit a fresh request if needed.";
            case "SCHEDULED", "PICKUP_SCHEDULED" ->
                    "Keep the items packed and ready before pickup time.";
            case "PICKED_UP" ->
                    "No action required from your side.";
            case "SUBMITTED", "PENDING" ->
                    "Our admin team will review and notify you soon.";
            default ->
                    "Please check your dashboard for complete request details.";
        };
    }

    private String statusHeadline(String status) {
        return switch (status) {
            case "ACCEPTED" -> "Request Accepted";
            case "REJECTED" -> "Request Rejected";
            case "SCHEDULED", "PICKUP_SCHEDULED" -> "Pickup Scheduled";
            case "PICKED_UP" -> "Pickup Completed";
            case "SUBMITTED", "PENDING" -> "Request In Review";
            default -> "Status Updated";
        };
    }

    private String titleCase(String value) {

        String[] parts = value.toLowerCase(Locale.ROOT).split("_");
        StringBuilder out = new StringBuilder();

        for (String part : parts) {

            if (part.isBlank()) {
                continue;
            }

            if (out.length() > 0) {
                out.append(' ');
            }

            out.append(Character.toUpperCase(part.charAt(0)));

            if (part.length() > 1) {
                out.append(part.substring(1));
            }
        }

        return out.length() == 0 ? value : out.toString();
    }
}