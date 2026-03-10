package com.ewaste.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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

    /* ----------------------------------------------------
       OTP EMAIL
    ---------------------------------------------------- */

    public void sendOtpEmail(String toEmail, String otp) {

        if (!mailEnabled) {
            System.out.println("DEV OTP for " + toEmail + ": " + otp);
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("♻ Smart E-Waste Management — Email Verification OTP");

            String body = """
            <html>
            <body style="font-family:Arial;background:#f4f6f8;padding:20px">

            <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px">

            <h2 style="text-align:center;color:#2e7d32">
            ♻ Smart E-Waste Management
            </h2>

            <p>Hello User,</p>

            <p>Please use the OTP below to verify your email.</p>

            <div style="text-align:center;margin:25px 0">

            <span style="font-size:30px;background:#e8f5e9;
            padding:15px 30px;border-radius:8px;font-weight:bold;color:#1b5e20">

            """ + otp + """

            </span>

            </div>

            <p>This OTP is valid for <b>5 minutes</b>.</p>

            <hr>

            <p style="font-size:12px;text-align:center;color:gray">
            © 2026 Smart E-Waste Management System
            </p>

            </div>

            </body>
            </html>
            """;

            helper.setText(body, true);
            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* ----------------------------------------------------
       PICKUP SCHEDULE EMAIL
    ---------------------------------------------------- */

    public void sendPickupScheduleEmail(
            String toEmail,
            Long requestId,
            String deviceLabel,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String personnelName
    ) {

        if (!mailEnabled) {
            System.out.println("DEV pickup schedule email");
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("🚚 Pickup Scheduled - E-Waste Loop");

            String slotLabel = formatPickupSlot(pickupTime);

            String body = """
            <html>
            <body style="margin:0;padding:24px;background:#eef3ef;font-family:Arial">

            <div style="max-width:560px;margin:auto;background:white;border:1px solid #d9e4dd">

            <div style="background:#2f776f;padding:22px;text-align:center;color:white;font-weight:bold;font-size:18px">
            ♻ E-Waste Loop
            </div>

            <div style="padding:22px">

            <div style="font-size:28px">🚚</div>

            <h2 style="margin-top:5px">Pickup Scheduled!</h2>

            <p>Great news! A pickup has been scheduled for your e-waste request.</p>

            <div style="border:1px solid #e3e9e4;border-radius:10px;padding:15px">

            <p><b>Request ID:</b> #%d</p>

            <p><b>Device:</b> %s</p>

            <div style="background:#edf6ee;padding:12px;border-radius:8px">

            <p><b>📅 Date:</b> %s</p>

            <p><b>🕘 Time:</b> %s</p>

            <p><b>👤 Contact Person:</b> %s</p>

            </div>

            </div>

            </div>

            </div>

            </body>
            </html>
            """.formatted(
                    requestId,
                    deviceLabel,
                    pickupDate,
                    slotLabel,
                    personnelName == null ? "To be assigned" : personnelName
            );

            helper.setText(body, true);
            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* ----------------------------------------------------
       STATUS UPDATE EMAIL
    ---------------------------------------------------- */

    // Wrapper method (fixes your compilation error)
    public void sendStatusUpdateEmail(String toEmail, Long requestId, String status) {
        sendStatusUpdateEmail(toEmail, requestId, status, null);
    }

    public void sendStatusUpdateEmail(
            String toEmail,
            Long requestId,
            String status,
            String adminDetail
    ) {

        if (!mailEnabled) {
            System.out.println("DEV status email");
            return;
        }

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String normalizedStatus =
                    status == null ? "PENDING" : status.toUpperCase(Locale.ROOT);

            helper.setTo(toEmail);

            String subject = switch (normalizedStatus) {
                case "REJECTED" -> "❌ Request Rejected";
                case "PICKED_UP" -> "✅ Pickup Completed";
                default -> "📢 Request Status Updated";
            };

            helper.setSubject(subject);

            String icon = switch (normalizedStatus) {
                case "REJECTED" -> "❌";
                case "PICKED_UP" -> "✅";
                default -> "📢";
            };

            String messageText = switch (normalizedStatus) {
                case "REJECTED" -> "Unfortunately your request could not be approved.";
                case "PICKED_UP" -> "Your e-waste has been successfully collected.";
                default -> "Your request status has been updated.";
            };

            String body = """
            <html>
            <body style="margin:0;padding:24px;background:#eef3ef;font-family:Arial">

            <div style="max-width:560px;margin:auto;background:white;border:1px solid #d9e4dd">

            <div style="background:#2f776f;padding:22px;text-align:center;color:white;font-weight:bold;font-size:18px">
            ♻ E-Waste Loop
            </div>

            <div style="padding:22px">

            <div style="font-size:28px">%s</div>

            <h2>%s</h2>

            <p>%s</p>

            <div style="border:1px solid #e3e9e4;border-radius:10px;padding:15px">

            <p><b>Request ID:</b> #%d</p>

            <p><b>Status:</b> %s</p>

            </div>

            <div style="margin-top:15px;background:#edf6ee;padding:12px;border-radius:8px">

            <p><b>Details:</b></p>

            <p>%s</p>

            </div>

            </div>

            </div>

            </body>
            </html>
            """.formatted(
                    icon,
                    titleCase(normalizedStatus),
                    messageText,
                    requestId,
                    titleCase(normalizedStatus),
                    adminDetail == null ? "Please check your dashboard for more details." : adminDetail
            );

            helper.setText(body, true);
            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* ----------------------------------------------------
       HELPERS
    ---------------------------------------------------- */

    private String titleCase(String value) {

        String[] parts = value.toLowerCase().split("_");

        StringBuilder out = new StringBuilder();

        for (String part : parts) {

            if (out.length() > 0) out.append(" ");

            out.append(Character.toUpperCase(part.charAt(0)))
                    .append(part.substring(1));
        }

        return out.toString();
    }

    private String formatPickupSlot(LocalTime pickupTime) {

        if (pickupTime == null) return "To be assigned";

        return switch (pickupTime.toString()) {

            case "09:00" -> "Morning (9:00 AM - 12:00 PM)";
            case "12:00" -> "Noon (12:00 PM - 03:00 PM)";
            case "15:00" -> "Afternoon (3:00 PM - 06:00 PM)";
            case "18:00" -> "Evening (6:00 PM - 09:00 PM)";

            default -> pickupTime.toString();
        };
    }
}