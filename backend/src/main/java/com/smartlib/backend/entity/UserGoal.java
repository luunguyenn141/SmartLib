package com.smartlib.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "user_goals", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_goal_user_id", columnNames = {"user_id"})
})
public class UserGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Min(1)
    @Column(nullable = false)
    private Integer booksPerMonth = 2;

    @Min(1)
    @Column(nullable = false)
    private Integer minutesPerDay = 20;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getBooksPerMonth() { return booksPerMonth; }
    public void setBooksPerMonth(Integer booksPerMonth) { this.booksPerMonth = booksPerMonth; }

    public Integer getMinutesPerDay() { return minutesPerDay; }
    public void setMinutesPerDay(Integer minutesPerDay) { this.minutesPerDay = minutesPerDay; }
}
