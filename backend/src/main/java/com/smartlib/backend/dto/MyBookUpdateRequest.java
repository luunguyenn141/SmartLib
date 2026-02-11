package com.smartlib.backend.dto;

import com.smartlib.backend.entity.ReadingStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class MyBookUpdateRequest {
    private ReadingStatus status;

    @Min(1)
    @Max(5)
    private Integer rating;

    @Min(0)
    @Max(100)
    private Integer progressPercent;

    public ReadingStatus getStatus() { return status; }
    public void setStatus(ReadingStatus status) { this.status = status; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
}
