package com.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateCountRecordDTO {
    @NotNull(message = "记录ID不能为空")
    private Long recordId;

    @NotNull(message = "盘点数量不能为空")
    private Integer countedQuantity;
}
