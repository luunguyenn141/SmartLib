package com.smartlib.backend.service;

import com.smartlib.backend.dto.*;
import com.smartlib.backend.entity.*;
import com.smartlib.backend.repository.BookRepository;
import com.smartlib.backend.repository.ReadingSessionRepository;
import com.smartlib.backend.repository.UserBookRepository;
import com.smartlib.backend.repository.UserGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class MyReadingService {
    private final UserBookRepository userBookRepository;
    private final ReadingSessionRepository readingSessionRepository;
    private final UserGoalRepository userGoalRepository;
    private final BookRepository bookRepository;

    public MyReadingService(
            UserBookRepository userBookRepository,
            ReadingSessionRepository readingSessionRepository,
            UserGoalRepository userGoalRepository,
            BookRepository bookRepository
    ) {
        this.userBookRepository = userBookRepository;
        this.readingSessionRepository = readingSessionRepository;
        this.userGoalRepository = userGoalRepository;
        this.bookRepository = bookRepository;
    }

    public List<MyBookResponse> listMyBooks(User user, ReadingStatus status) {
        List<UserBook> rows = status == null
                ? userBookRepository.findByUserOrderByUpdatedAtDesc(user)
                : userBookRepository.findByUserAndStatusOrderByUpdatedAtDesc(user, status);
        return rows.stream().map(this::toMyBookResponse).toList();
    }

    @Transactional
    public MyBookResponse addMyBook(User user, MyBookCreateRequest req) {
        Book book = bookRepository.findById(req.getBookId()).orElseThrow();
        UserBook row = userBookRepository.findByUserAndBook(user, book).orElseGet(() -> {
            UserBook created = new UserBook();
            created.setUser(user);
            created.setBook(book);
            created.setStatus(ReadingStatus.TO_READ);
            created.setProgressPercent(0);
            return created;
        });
        ReadingStatus nextStatus = req.getStatus() == null ? ReadingStatus.TO_READ : req.getStatus();
        applyStatusDates(row, nextStatus);
        row.setStatus(nextStatus);
        return toMyBookResponse(userBookRepository.save(row));
    }

    @Transactional
    public MyBookResponse updateMyBook(User user, Long myBookId, MyBookUpdateRequest req) {
        UserBook row = userBookRepository.findByIdAndUser(myBookId, user).orElseThrow();
        if (req.getStatus() != null) {
            applyStatusDates(row, req.getStatus());
            row.setStatus(req.getStatus());
        }
        if (req.getRating() != null) {
            row.setRating(req.getRating());
        }
        if (req.getProgressPercent() != null) {
            row.setProgressPercent(req.getProgressPercent());
            if (req.getProgressPercent() >= 100 && row.getStatus() != ReadingStatus.FINISHED) {
                row.setStatus(ReadingStatus.FINISHED);
                if (row.getFinishedAt() == null) {
                    row.setFinishedAt(LocalDate.now());
                }
            }
        }
        return toMyBookResponse(userBookRepository.save(row));
    }

    @Transactional
    public void deleteMyBook(User user, Long myBookId) {
        UserBook row = userBookRepository.findByIdAndUser(myBookId, user).orElseThrow();
        userBookRepository.delete(row);
    }

    public List<ReadingSessionResponse> listSessions(User user, LocalDate from, LocalDate to) {
        List<ReadingSession> rows = (from == null || to == null)
                ? readingSessionRepository.findByUserOrderBySessionDateDescCreatedAtDesc(user)
                : readingSessionRepository.findByUserAndSessionDateBetweenOrderBySessionDateDescCreatedAtDesc(user, from, to);
        return rows.stream().map(this::toSessionResponse).toList();
    }

    @Transactional
    public ReadingSessionResponse createSession(User user, ReadingSessionCreateRequest req) {
        Book book = bookRepository.findById(req.getBookId()).orElseThrow();
        LocalDate date = LocalDate.parse(req.getSessionDate());

        UserBook row = userBookRepository.findByUserAndBook(user, book).orElseGet(() -> {
            UserBook created = new UserBook();
            created.setUser(user);
            created.setBook(book);
            created.setStatus(ReadingStatus.READING);
            created.setStartedAt(LocalDate.now());
            created.setProgressPercent(0);
            return created;
        });
        if (row.getStatus() == ReadingStatus.TO_READ) {
            row.setStatus(ReadingStatus.READING);
            if (row.getStartedAt() == null) {
                row.setStartedAt(LocalDate.now());
            }
            userBookRepository.save(row);
        }

        ReadingSession session = new ReadingSession();
        session.setUser(user);
        session.setBook(book);
        session.setSessionDate(date);
        session.setMinutesRead(req.getMinutesRead());
        session.setPagesRead(req.getPagesRead() == null ? 0 : req.getPagesRead());
        session.setNote(req.getNote());
        return toSessionResponse(readingSessionRepository.save(session));
    }

    @Transactional
    public UserGoalResponse updateGoals(User user, UserGoalUpdateRequest req) {
        UserGoal goal = userGoalRepository.findByUser(user).orElseGet(() -> {
            UserGoal created = new UserGoal();
            created.setUser(user);
            return created;
        });
        goal.setBooksPerMonth(req.getBooksPerMonth());
        goal.setMinutesPerDay(req.getMinutesPerDay());
        return toUserGoalResponse(userGoalRepository.save(goal));
    }

    public UserGoalResponse getGoals(User user) {
        UserGoal goal = userGoalRepository.findByUser(user).orElseGet(() -> {
            UserGoal created = new UserGoal();
            created.setUser(user);
            return userGoalRepository.save(created);
        });
        return toUserGoalResponse(goal);
    }

    public MyDashboardResponse getDashboard(User user) {
        MyDashboardResponse out = new MyDashboardResponse();
        out.setTotalBooks(userBookRepository.findByUserOrderByUpdatedAtDesc(user).size());
        out.setToReadBooks(userBookRepository.countByUserAndStatus(user, ReadingStatus.TO_READ));
        out.setReadingBooks(userBookRepository.countByUserAndStatus(user, ReadingStatus.READING));
        out.setFinishedBooks(userBookRepository.countByUserAndStatus(user, ReadingStatus.FINISHED));

        UserGoal goal = userGoalRepository.findByUser(user).orElseGet(() -> {
            UserGoal created = new UserGoal();
            created.setUser(user);
            return userGoalRepository.save(created);
        });
        out.setBooksPerMonthGoal(goal.getBooksPerMonth());
        out.setMinutesPerDayGoal(goal.getMinutesPerDay());

        List<ReadingSession> sessions = readingSessionRepository.findByUserOrderBySessionDateDescCreatedAtDesc(user);
        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);
        int minutesToday = 0;
        int minutesMonth = 0;
        for (ReadingSession s : sessions) {
            if (s.getSessionDate() == null) continue;
            if (s.getSessionDate().equals(today)) {
                minutesToday += safeInt(s.getMinutesRead());
            }
            if (YearMonth.from(s.getSessionDate()).equals(thisMonth)) {
                minutesMonth += safeInt(s.getMinutesRead());
            }
        }
        out.setMinutesReadToday(minutesToday);
        out.setMinutesReadThisMonth(minutesMonth);

        out.setRecentSessions(
                sessions.stream()
                        .limit(5)
                        .map(s -> new MyDashboardResponse.RecentSession(
                                s.getId(),
                                s.getBook() == null ? null : s.getBook().getId(),
                                s.getBook() == null ? null : s.getBook().getTitle(),
                                s.getSessionDate() == null ? null : s.getSessionDate().toString(),
                                safeInt(s.getMinutesRead()),
                                safeInt(s.getPagesRead())
                        ))
                        .toList()
        );

        out.setMonthlyFinished(buildMonthlyFinished(user));
        return out;
    }

    private List<MyDashboardResponse.MonthlyCount> buildMonthlyFinished(User user) {
        List<UserBook> finishedRows = userBookRepository.findByUserAndStatusOrderByUpdatedAtDesc(user, ReadingStatus.FINISHED);
        Map<YearMonth, Long> bucket = new HashMap<>();
        LocalDate now = LocalDate.now();
        for (int i = 0; i < 6; i++) {
            bucket.put(YearMonth.from(now.minusMonths(i)), 0L);
        }
        for (UserBook row : finishedRows) {
            LocalDate finished = row.getFinishedAt();
            if (finished == null) continue;
            YearMonth ym = YearMonth.from(finished);
            if (bucket.containsKey(ym)) {
                bucket.put(ym, bucket.get(ym) + 1);
            }
        }
        List<MyDashboardResponse.MonthlyCount> data = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            data.add(new MyDashboardResponse.MonthlyCount(ym.toString(), bucket.getOrDefault(ym, 0L)));
        }
        return data;
    }

    private void applyStatusDates(UserBook row, ReadingStatus status) {
        if (status == ReadingStatus.READING && row.getStartedAt() == null) {
            row.setStartedAt(LocalDate.now());
        }
        if (status == ReadingStatus.FINISHED) {
            if (row.getFinishedAt() == null) {
                row.setFinishedAt(LocalDate.now());
            }
            if (row.getProgressPercent() == null || row.getProgressPercent() < 100) {
                row.setProgressPercent(100);
            }
        }
    }

    private MyBookResponse toMyBookResponse(UserBook row) {
        MyBookResponse out = new MyBookResponse();
        out.setId(row.getId());
        out.setBookId(row.getBook() == null ? null : row.getBook().getId());
        out.setTitle(row.getBook() == null ? null : row.getBook().getTitle());
        out.setAuthor(row.getBook() == null ? null : row.getBook().getAuthor());
        out.setImageUrl(row.getBook() == null ? null : row.getBook().getImageUrl());
        out.setStatus(row.getStatus());
        out.setRating(row.getRating());
        out.setProgressPercent(row.getProgressPercent());
        out.setStartedAt(row.getStartedAt() == null ? null : row.getStartedAt().toString());
        out.setFinishedAt(row.getFinishedAt() == null ? null : row.getFinishedAt().toString());
        return out;
    }

    private ReadingSessionResponse toSessionResponse(ReadingSession row) {
        ReadingSessionResponse out = new ReadingSessionResponse();
        out.setId(row.getId());
        out.setBookId(row.getBook() == null ? null : row.getBook().getId());
        out.setBookTitle(row.getBook() == null ? null : row.getBook().getTitle());
        out.setSessionDate(row.getSessionDate() == null ? null : row.getSessionDate().toString());
        out.setMinutesRead(row.getMinutesRead());
        out.setPagesRead(row.getPagesRead());
        out.setNote(row.getNote());
        return out;
    }

    private UserGoalResponse toUserGoalResponse(UserGoal goal) {
        UserGoalResponse out = new UserGoalResponse();
        out.setBooksPerMonth(goal.getBooksPerMonth());
        out.setMinutesPerDay(goal.getMinutesPerDay());
        return out;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
