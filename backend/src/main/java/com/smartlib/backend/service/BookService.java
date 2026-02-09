package com.smartlib.backend.service;

import com.smartlib.backend.entity.Book;
import com.smartlib.backend.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BookService {
    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    public Page<Book> search(String q, Boolean available, Pageable pageable) {
        String trimmed = (q == null || q.isBlank()) ? null : q.trim();
        return bookRepository.search(trimmed, available, pageable);
    }

    public Optional<Book> findById(Long id) {
        return bookRepository.findById(id);
    }

    public Book create(Book book) {
        validateCopies(book);
        return bookRepository.save(book);
    }

    public Book update(Long id, Book updates) {
        Book existing = bookRepository.findById(id).orElseThrow();
        existing.setTitle(updates.getTitle());
        existing.setAuthor(updates.getAuthor());
        existing.setIsbn(updates.getIsbn());
        existing.setDescription(updates.getDescription());
        existing.setImageUrl(updates.getImageUrl());
        existing.setTotalCopies(updates.getTotalCopies());
        existing.setAvailableCopies(updates.getAvailableCopies());
        validateCopies(existing);
        return bookRepository.save(existing);
    }

    public void delete(Long id) {
        bookRepository.deleteById(id);
    }

    private void validateCopies(Book book) {
        Integer total = book.getTotalCopies();
        Integer available = book.getAvailableCopies();
        if (total != null && available != null && available > total) {
            throw new IllegalArgumentException("availableCopies cannot exceed totalCopies");
        }
    }
}
