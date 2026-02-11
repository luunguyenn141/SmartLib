package com.smartlib.backend.dto;

import com.smartlib.backend.entity.ReadingStatus;
import jakarta.validation.constraints.NotNull;

public class MyBookCreateRequest {
    @NotNull
    private Long bookId;

    private ReadingStatus status = ReadingStatus.TO_READ;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }

    public ReadingStatus getStatus() { return status; }
    public void setStatus(ReadingStatus status) { this.status = status; }
}
