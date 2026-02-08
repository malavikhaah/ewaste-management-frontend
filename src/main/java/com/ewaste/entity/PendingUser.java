package com.ewaste.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private String phone;

    @Column(name = "otp")
    private String otp;

    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;
}
