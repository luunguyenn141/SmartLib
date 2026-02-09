package com.smartlib.backend.controller;

import com.smartlib.backend.dto.LoanRequest;
import com.smartlib.backend.entity.Loan;
import com.smartlib.backend.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {
    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping
    public List<Loan> list() {
        return loanService.findAll();
    }

    @PostMapping("/borrow")
    public Loan borrow(@Valid @RequestBody LoanRequest req) {
        return loanService.borrow(req);
    }

    @PostMapping("/{id}/return")
    public Loan returnBook(@PathVariable Long id) {
        return loanService.returnBook(id);
    }
}
