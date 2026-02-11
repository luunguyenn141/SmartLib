package com.smartlib.backend.repository;

import com.smartlib.backend.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {
    Page<Book> findByAvailableCopiesGreaterThan(int availableCopies, Pageable pageable);

    @Query("""
        SELECT b FROM Book b
        WHERE (:q IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(b.author) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:available IS NULL OR b.availableCopies > 0)
        """)
    Page<Book> search(@Param("q") String q, @Param("available") Boolean available, Pageable pageable);
}
