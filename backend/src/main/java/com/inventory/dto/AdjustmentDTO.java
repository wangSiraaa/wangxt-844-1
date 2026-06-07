package com.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustmentDTO {
    @NotNull(message = "任务ID不能为空")
    private Long taskId;

    @NotBlank(message = "操作人不能为空")
    private String operator;

    private String remark;
}
