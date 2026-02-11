package com.smartlib.backend.repository;

import com.smartlib.backend.entity.Book;
import com.smartlib.backend.entity.ReadingStatus;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.entity.UserBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBookRepository extends JpaRepository<UserBook, Long> {
    List<UserBook> findByUserOrderByUpdatedAtDesc(User user);
    List<UserBook> findByUserAndStatusOrderByUpdatedAtDesc(User user, ReadingStatus status);
    Optional<UserBook> findByIdAndUser(Long id, User user);
    Optional<UserBook> findByUserAndBook(User user, Book book);
    long countByUserAndStatus(User user, ReadingStatus status);
}
