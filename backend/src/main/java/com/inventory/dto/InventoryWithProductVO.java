package com.inventory.dto;

import com.inventory.entity.CountRecord;
import com.inventory.entity.Inventory;
import com.inventory.entity.Product;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryWithProductVO {
    private Long id;
    private Long storeId;
    private Long productId;
    private String sku;
    private String productName;
    private String category;
    private BigDecimal unitPrice;
    private String unit;
    private Integer systemQuantity;
    private Integer countedQuantity;
    private Integer diffQuantity;
    private BigDecimal diffAmount;
    private Boolean readOnly;
    private Long recordId;

    public InventoryWithProductVO() {
    }

    public InventoryWithProductVO(Inventory inventory, Product product) {
        this.id = inventory.getId();
        this.storeId = inventory.getStoreId();
        this.productId = inventory.getProductId();
        this.sku = product.getSku();
        this.productName = product.getName();
        this.category = product.getCategory();
        this.unitPrice = product.getUnitPrice();
        this.unit = product.getUnit();
        this.systemQuantity = inventory.getQuantity();
        this.countedQuantity = inventory.getQuantity();
        this.diffQuantity = 0;
        this.diffAmount = BigDecimal.ZERO;
        this.readOnly = false;
    }

    public InventoryWithProductVO(CountRecord record, Product product) {
        this.recordId = record.getId();
        this.storeId = null;
        this.productId = record.getProductId();
        this.sku = product.getSku();
        this.productName = product.getName();
        this.category = product.getCategory();
        this.unitPrice = record.getUnitPrice();
        this.unit = product.getUnit();
        this.systemQuantity = record.getSystemQuantity();
        this.countedQuantity = record.getCountedQuantity();
        this.diffQuantity = record.getDiffQuantity();
        this.diffAmount = record.getDiffAmount();
        this.readOnly = record.getReadOnly();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getSystemQuantity() {
        return systemQuantity;
    }

    public void setSystemQuantity(Integer systemQuantity) {
        this.systemQuantity = systemQuantity;
    }

    public Integer getCountedQuantity() {
        return countedQuantity;
    }

    public void setCountedQuantity(Integer countedQuantity) {
        this.countedQuantity = countedQuantity;
    }

    public Integer getDiffQuantity() {
        return diffQuantity;
    }

    public void setDiffQuantity(Integer diffQuantity) {
        this.diffQuantity = diffQuantity;
    }

    public BigDecimal getDiffAmount() {
        return diffAmount;
    }

    public void setDiffAmount(BigDecimal diffAmount) {
        this.diffAmount = diffAmount;
    }

    public Boolean getReadOnly() {
        return readOnly;
    }

    public void setReadOnly(Boolean readOnly) {
        this.readOnly = readOnly;
    }

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }
}
