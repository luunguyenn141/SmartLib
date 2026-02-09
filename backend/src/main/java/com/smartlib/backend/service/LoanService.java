package com.smartlib.backend.service;

import com.smartlib.backend.dto.LoanRequest;
import com.smartlib.backend.entity.Book;
import com.smartlib.backend.entity.Loan;
import com.smartlib.backend.entity.LoanStatus;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.repository.BookRepository;
import com.smartlib.backend.repository.LoanRepository;
import com.smartlib.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LoanService {
    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public LoanService(LoanRepository loanRepository, UserRepository userRepository, BookRepository bookRepository) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    public List<Loan> findAll() {
        return loanRepository.findAll();
    }

    @Transactional
    public Loan borrow(LoanRequest req) {
        User user = userRepository.findById(req.getUserId()).orElseThrow();
        Book book = bookRepository.findById(req.getBookId()).orElseThrow();
        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new IllegalStateException("No available copies");
        }

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setBorrowDate(LocalDate.now());
        loan.setDueDate(LocalDate.parse(req.getDueDate()));
        loan.setStatus(LoanStatus.BORROWED);

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        return loanRepository.save(loan);
    }

    @Transactional
    public Loan returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        if (loan.getStatus() != LoanStatus.BORROWED) {
            return loan;
        }
        loan.setStatus(LoanStatus.RETURNED);
        loan.setReturnDate(LocalDate.now());

        Book book = loan.getBook();
        Integer total = book.getTotalCopies();
        Integer available = book.getAvailableCopies() == null ? 0 : book.getAvailableCopies();
        int nextAvailable = available + 1;
        if (total != null && nextAvailable > total) {
            nextAvailable = total;
        }
        book.setAvailableCopies(nextAvailable);
        bookRepository.save(book);
        return loanRepository.save(loan);
    }
}
