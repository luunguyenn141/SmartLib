package com.smartlib.backend.dto;

public class ReadingSessionResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String sessionDate;
    private Integer minutesRead;
    private Integer pagesRead;
    private String note;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }

    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

    public String getSessionDate() { return sessionDate; }
    public void setSessionDate(String sessionDate) { this.sessionDate = sessionDate; }

    public Integer getMinutesRead() { return minutesRead; }
    public void setMinutesRead(Integer minutesRead) { this.minutesRead = minutesRead; }

    public Integer getPagesRead() { return pagesRead; }
    public void setPagesRead(Integer pagesRead) { this.pagesRead = pagesRead; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
