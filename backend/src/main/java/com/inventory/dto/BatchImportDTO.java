package com.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchImportDTO {
    @NotEmpty(message = "导入数据不能为空")
    @Valid
    private List<BatchImportItemDTO> items;

    public List<BatchImportItemDTO> getItems() {
        return items;
    }

    public void setItems(List<BatchImportItemDTO> items) {
        this.items = items;
    }
}
