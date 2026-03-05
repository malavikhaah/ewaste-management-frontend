package com.ewaste.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ewaste.entity.EwasteRequest;
import com.ewaste.entity.User;

public interface EwasteRequestRepository extends JpaRepository<EwasteRequest, Long> {

    // For user-side requests (already existing)
    List<EwasteRequest> findByUserOrderByCreatedAtDesc(User user);

    // For fetching a specific request of a user
    Optional<EwasteRequest> findByIdAndUser(Long id, User user);

    // ✅ ADD THIS — for Admin (latest requests first)
    List<EwasteRequest> findAllByOrderByCreatedAtDesc();
}