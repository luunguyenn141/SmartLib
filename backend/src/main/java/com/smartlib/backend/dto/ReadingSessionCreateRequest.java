package com.smartlib.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ReadingSessionCreateRequest {
    @NotNull
    private Long bookId;

    @NotBlank
    private String sessionDate;

    @NotNull
    @Min(1)
    private Integer minutesRead;

    @Min(0)
    private Integer pagesRead = 0;

    private String note;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }

    public String getSessionDate() { return sessionDate; }
    public void setSessionDate(String sessionDate) { this.sessionDate = sessionDate; }

    public Integer getMinutesRead() { return minutesRead; }
    public void setMinutesRead(Integer minutesRead) { this.minutesRead = minutesRead; }

    public Integer getPagesRead() { return pagesRead; }
    public void setPagesRead(Integer pagesRead) { this.pagesRead = pagesRead; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
