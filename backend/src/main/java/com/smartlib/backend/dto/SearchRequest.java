package com.smartlib.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class SearchRequest {
    @NotBlank
    private String query;

    @JsonProperty("top_k")
    @Min(1)
    @Max(50)
    private int topK = 10;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
}
