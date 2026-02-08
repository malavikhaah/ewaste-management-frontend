package com.ewaste.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String phone;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @JsonIgnore
    @Column(name = "otp")
    private String otp;

    @JsonIgnore
    @Column(name = "otp_expires_at")
    private LocalDateTime otpExpiresAt;
}
