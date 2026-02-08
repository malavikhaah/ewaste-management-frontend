package com.ewaste.repository;

import com.ewaste.entity.PendingUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingUserRepository extends JpaRepository<PendingUser, Long> {
    PendingUser findByEmail(String email);
}
