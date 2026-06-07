package com.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_adjustment")
public class InventoryAdjustment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "record_id", nullable = false)
    private Long recordId;

    @Column(name = "adjust_quantity", nullable = false)
    private Integer adjustQuantity;

    @Column(name = "adjust_time")
    private LocalDateTime adjustTime;

    @Column(length = 50)
    private String operator;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}
