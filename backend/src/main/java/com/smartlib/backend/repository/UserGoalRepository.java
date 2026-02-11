package com.smartlib.backend.repository;

import com.smartlib.backend.entity.User;
import com.smartlib.backend.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    Optional<UserGoal> findByUser(User user);
}
