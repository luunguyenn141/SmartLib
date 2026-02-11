package com.smartlib.backend.repository;

import com.smartlib.backend.entity.ReadingSession;
import com.smartlib.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {
    List<ReadingSession> findByUserOrderBySessionDateDescCreatedAtDesc(User user);
    List<ReadingSession> findByUserAndSessionDateBetweenOrderBySessionDateDescCreatedAtDesc(User user, LocalDate from, LocalDate to);
}
