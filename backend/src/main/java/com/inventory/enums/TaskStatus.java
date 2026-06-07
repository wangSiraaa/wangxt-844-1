package com.inventory.enums;

public enum TaskStatus {
    DRAFT("草稿"),
    SUBMITTED("已提交"),
    REVIEWING("待复盘"),
    REVIEWED("已复盘"),
    ADJUSTED("已调账"),
    CLOSED("已关闭");

    private final String description;

    TaskStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
