package com.inventory.enums;

public enum ReviewResult {
    PENDING("待处理"),
    APPROVED("通过"),
    REJECTED("驳回");

    private final String description;

    ReviewResult(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
