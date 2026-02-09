package com.smartlib.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SearchResult {
    private Long id;
    @JsonProperty("google_books_id")
    private String googleBooksId;
    private String title;
    private String author;
    private String description;
    @JsonProperty("image_url")
    private String imageUrl;
    @JsonProperty("published_date")
    private String publishedDate;
    private double score;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getGoogleBooksId() { return googleBooksId; }
    public void setGoogleBooksId(String googleBooksId) { this.googleBooksId = googleBooksId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getPublishedDate() { return publishedDate; }
    public void setPublishedDate(String publishedDate) { this.publishedDate = publishedDate; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
}
