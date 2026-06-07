package com.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCountTaskDTO {
    @NotNull(message = "门店ID不能为空")
    private Long storeId;

    private String createdBy;

    private String remark;
}
