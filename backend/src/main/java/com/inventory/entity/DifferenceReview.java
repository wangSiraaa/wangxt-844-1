package com.inventory.entity;

import com.inventory.enums.ReviewResult;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "difference_review")
public class DifferenceReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "record_id", nullable = false)
    private Long recordId;

    @Column(nullable = false, length = 50)
    private String reviewer;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_result", nullable = false, length = 20)
    private ReviewResult reviewResult = ReviewResult.PENDING;

    @Column(name = "review_comment", length = 500)
    private String reviewComment;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}
