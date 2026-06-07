package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.inventory.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "count_task")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CountTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "task_no", nullable = false, unique = true, length = 50)
    private String taskNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_status", nullable = false, length = 20)
    private TaskStatus taskStatus = TaskStatus.DRAFT;

    @Column(name = "total_diff_amount", precision = 12, scale = 2)
    private BigDecimal totalDiffAmount = BigDecimal.ZERO;

    @Column(name = "submit_time")
    private LocalDateTime submitTime;

    @Column(name = "close_time")
    private LocalDateTime closeTime;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", insertable = false, updatable = false)
    private Store store;
}
