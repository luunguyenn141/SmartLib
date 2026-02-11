package com.smartlib.backend.dto;

public class UserGoalResponse {
    private Integer booksPerMonth;
    private Integer minutesPerDay;

    public Integer getBooksPerMonth() { return booksPerMonth; }
    public void setBooksPerMonth(Integer booksPerMonth) { this.booksPerMonth = booksPerMonth; }

    public Integer getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(Integer minutesPerDay) { this.minutesPerDay = minutesPerDay; }
}
