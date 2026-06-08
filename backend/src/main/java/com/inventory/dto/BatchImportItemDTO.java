package com.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BatchImportItemDTO {
    @NotNull(message = "记录ID不能为空")
    private Long recordId;

    @NotNull(message = "盘点数量不能为空")
    private Integer countedQuantity;

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }

    public Integer getCountedQuantity() {
        return countedQuantity;
    }

    public void setCountedQuantity(Integer countedQuantity) {
        this.countedQuantity = countedQuantity;
    }
}
