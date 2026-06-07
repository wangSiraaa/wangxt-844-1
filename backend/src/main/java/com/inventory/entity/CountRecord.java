package com.inventory.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "count_record", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"task_id", "product_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CountRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "system_quantity", nullable = false)
    private Integer systemQuantity = 0;

    @Column(name = "counted_quantity", nullable = false)
    private Integer countedQuantity = 0;

    @Column(name = "diff_quantity", nullable = false)
    private Integer diffQuantity = 0;

    @Column(name = "diff_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal diffAmount = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "is_read_only")
    private Boolean readOnly = false;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", insertable = false, updatable = false)
    private CountTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
}
