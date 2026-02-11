package com.smartlib.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class MyDashboardResponse {
    private long totalBooks;
    private long toReadBooks;
    private long readingBooks;
    private long finishedBooks;
    private int minutesReadThisMonth;
    private int minutesReadToday;
    private int booksPerMonthGoal;
    private int minutesPerDayGoal;
    private List<MonthlyCount> monthlyFinished = new ArrayList<>();
    private List<RecentSession> recentSessions = new ArrayList<>();

    public long getTotalBooks() { return totalBooks; }
    public void setTotalBooks(long totalBooks) { this.totalBooks = totalBooks; }

    public long getToReadBooks() { return toReadBooks; }
    public void setToReadBooks(long toReadBooks) { this.toReadBooks = toReadBooks; }

    public long getReadingBooks() { return readingBooks; }
    public void setReadingBooks(long readingBooks) { this.readingBooks = readingBooks; }

    public long getFinishedBooks() { return finishedBooks; }
    public void setFinishedBooks(long finishedBooks) { this.finishedBooks = finishedBooks; }

    public int getMinutesReadThisMonth() { return minutesReadThisMonth; }
    public void setMinutesReadThisMonth(int minutesReadThisMonth) { this.minutesReadThisMonth = minutesReadThisMonth; }

    public int getMinutesReadToday() { return minutesReadToday; }
    public void setMinutesReadToday(int minutesReadToday) { this.minutesReadToday = minutesReadToday; }

    public int getBooksPerMonthGoal() { return booksPerMonthGoal; }
    public void setBooksPerMonthGoal(int booksPerMonthGoal) { this.booksPerMonthGoal = booksPerMonthGoal; }

    public int getMinutesPerDayGoal() { return minutesPerDayGoal; }
    public void setMinutesPerDayGoal(int minutesPerDayGoal) { this.minutesPerDayGoal = minutesPerDayGoal; }

    public List<MonthlyCount> getMonthlyFinished() { return monthlyFinished; }
    public void setMonthlyFinished(List<MonthlyCount> monthlyFinished) { this.monthlyFinished = monthlyFinished; }

    public List<RecentSession> getRecentSessions() { return recentSessions; }
    public void setRecentSessions(List<RecentSession> recentSessions) { this.recentSessions = recentSessions; }

    public static class MonthlyCount {
        private String month;
        private long count;

        public MonthlyCount() {}

        public MonthlyCount(String month, long count) {
            this.month = month;
            this.count = count;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class RecentSession {
        private Long id;
        private Long bookId;
        private String bookTitle;
        private String sessionDate;
        private int minutesRead;
        private int pagesRead;

        public RecentSession() {}

        public RecentSession(Long id, Long bookId, String bookTitle, String sessionDate, int minutesRead, int pagesRead) {
            this.id = id;
            this.bookId = bookId;
            this.bookTitle = bookTitle;
            this.sessionDate = sessionDate;
            this.minutesRead = minutesRead;
            this.pagesRead = pagesRead;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getBookId() { return bookId; }
        public void setBookId(Long bookId) { this.bookId = bookId; }

        public String getBookTitle() { return bookTitle; }
        public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

        public String getSessionDate() { return sessionDate; }
        public void setSessionDate(String sessionDate) { this.sessionDate = sessionDate; }

        public int getMinutesRead() { return minutesRead; }
        public void setMinutesRead(int minutesRead) { this.minutesRead = minutesRead; }

        public int getPagesRead() { return pagesRead; }
        public void setPagesRead(int pagesRead) { this.pagesRead = pagesRead; }
    }
}
