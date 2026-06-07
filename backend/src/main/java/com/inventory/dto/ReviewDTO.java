package com.inventory.dto;

import com.inventory.enums.ReviewResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewDTO {
    @NotNull(message = "任务ID不能为空")
    private Long taskId;

    @NotBlank(message = "复盘人不能为空")
    private String reviewer;

    @NotNull(message = "复盘结果不能为空")
    private ReviewResult reviewResult;

    private String reviewComment;
}
