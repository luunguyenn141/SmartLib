package com.smartlib.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UserGoalUpdateRequest {
    @NotNull
    @Min(1)
    private Integer booksPerMonth;

    @NotNull
    @Min(1)
    private Integer minutesPerDay;

    public Integer getBooksPerMonth() { return booksPerMonth; }
    public void setBooksPerMonth(Integer booksPerMonth) { this.booksPerMonth = booksPerMonth; }

    public Integer getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(Integer minutesPerDay) { this.minutesPerDay = minutesPerDay; }
}
