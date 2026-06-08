package com.inventory.service;

import com.inventory.dto.BatchImportItemDTO;
import com.inventory.dto.CountTaskDetailVO;
import com.inventory.dto.CreateCountTaskDTO;
import com.inventory.dto.InventoryWithProductVO;
import com.inventory.entity.*;
import com.inventory.enums.ReviewResult;
import com.inventory.enums.TaskStatus;
import com.inventory.exception.BusinessException;
import com.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CountTaskService {

    private final CountTaskRepository countTaskRepository;
    private final CountRecordRepository countRecordRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final DifferenceReviewRepository reviewRepository;
    private final InventoryAdjustmentRepository adjustmentRepository;

    public List<CountTask> getTasksByStoreId(Long storeId) {
        return countTaskRepository.findByStoreIdOrderByCreatedTimeDesc(storeId);
    }

    public List<CountTask> getTasksByStatus(TaskStatus status) {
        return countTaskRepository.findByTaskStatusOrderByCreatedTimeDesc(status);
    }

    public CountTaskDetailVO getTaskDetail(Long taskId) {
        CountTask task = countTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));
        List<CountRecord> records = countRecordRepository.findByTaskIdOrderById(taskId);

        CountTaskDetailVO vo = new CountTaskDetailVO();
        vo.setTask(task);
        vo.setRecords(records);
        return vo;
    }

    @Transactional
    public CountTask createCountTask(CreateCountTaskDTO dto) {
        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("门店不存在: " + dto.getStoreId()));

        CountTask task = new CountTask();
        task.setStoreId(dto.getStoreId());
        task.setTaskNo(generateTaskNo());
        task.setTaskStatus(TaskStatus.DRAFT);
        task.setCreatedBy(dto.getCreatedBy() != null ? dto.getCreatedBy() : "system");
        task.setRemark(dto.getRemark());
        task = countTaskRepository.save(task);

        List<Inventory> inventories = inventoryRepository.findByStoreId(dto.getStoreId());
        List<CountRecord> records = new ArrayList<>();
        for (Inventory inv : inventories) {
            Product product = productRepository.findById(inv.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("商品不存在: " + inv.getProductId()));

            CountRecord record = new CountRecord();
            record.setTaskId(task.getId());
            record.setProductId(inv.getProductId());
            record.setSystemQuantity(inv.getQuantity());
            record.setCountedQuantity(inv.getQuantity());
            record.setDiffQuantity(0);
            record.setDiffAmount(BigDecimal.ZERO);
            record.setUnitPrice(product.getUnitPrice());
            record.setReadOnly(false);
            records.add(record);
        }
        countRecordRepository.saveAll(records);

        return task;
    }

    @Transactional
    public CountRecord updateCountRecord(Long recordId, Integer countedQuantity) {
        CountRecord record = countRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("盘点记录不存在: " + recordId));

        if (Boolean.TRUE.equals(record.getReadOnly())) {
            throw new BusinessException("盘点任务已关闭，盘点数据为只读状态，无法修改");
        }

        final Long taskId = record.getTaskId();
        CountTask task = countTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() == TaskStatus.CLOSED) {
            throw new BusinessException("盘点任务已关闭，无法修改盘点数据");
        }
        if (task.getTaskStatus() != TaskStatus.DRAFT && task.getTaskStatus() != TaskStatus.REVIEWING) {
            throw new BusinessException("当前任务状态不允许修改盘点数据");
        }

        int diffQuantity = countedQuantity - record.getSystemQuantity();
        BigDecimal diffAmount = BigDecimal.valueOf(diffQuantity).multiply(record.getUnitPrice());

        record.setCountedQuantity(countedQuantity);
        record.setDiffQuantity(diffQuantity);
        record.setDiffAmount(diffAmount);

        record = countRecordRepository.save(record);
        recalculateTotalDiffAmount(record.getTaskId());

        return record;
    }

    @Transactional
    public CountTask submitTask(Long taskId) {
        CountTask task = countTaskRepository.findByIdWithLock(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() != TaskStatus.DRAFT && task.getTaskStatus() != TaskStatus.REVIEWING) {
            throw new BusinessException("当前任务状态不允许提交");
        }

        Store store = storeRepository.findById(task.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("门店不存在: " + task.getStoreId()));

        BigDecimal totalDiffAmount = calculateTotalDiffAmount(taskId);
        task.setTotalDiffAmount(totalDiffAmount);
        task.setSubmitTime(LocalDateTime.now());

        if (totalDiffAmount.abs().compareTo(store.getThresholdAmount()) > 0) {
            task.setTaskStatus(TaskStatus.REVIEWING);
            task.setRemark("差异金额 " + totalDiffAmount + " 超过阈值 " + store.getThresholdAmount() + "，需要区域复盘");
        } else {
            task.setTaskStatus(TaskStatus.SUBMITTED);
        }

        return countTaskRepository.save(task);
    }

    @Transactional
    public CountTask reviewTask(Long taskId, String reviewer, ReviewResult result, String comment) {
        CountTask task = countTaskRepository.findByIdWithLock(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() != TaskStatus.REVIEWING) {
            throw new BusinessException("当前任务状态不需要复盘");
        }

        List<CountRecord> records = countRecordRepository.findByTaskIdOrderById(taskId);
        for (CountRecord record : records) {
            if (record.getDiffAmount().abs().compareTo(BigDecimal.ZERO) > 0) {
                DifferenceReview review = new DifferenceReview();
                review.setTaskId(taskId);
                review.setRecordId(record.getId());
                review.setReviewer(reviewer);
                review.setReviewTime(LocalDateTime.now());
                review.setReviewResult(result);
                review.setReviewComment(comment);
                reviewRepository.save(review);
            }
        }

        if (result == ReviewResult.APPROVED) {
            task.setTaskStatus(TaskStatus.REVIEWED);
        } else if (result == ReviewResult.REJECTED) {
            task.setTaskStatus(TaskStatus.DRAFT);
        }

        return countTaskRepository.save(task);
    }

    @Transactional
    public CountTask adjustInventory(Long taskId, String operator, String remark) {
        CountTask task = countTaskRepository.findByIdWithLock(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() != TaskStatus.REVIEWED && task.getTaskStatus() != TaskStatus.SUBMITTED) {
            throw new BusinessException("未完成复盘，不能进行调账操作。当前状态: " + task.getTaskStatus().getDescription());
        }

        Store store = storeRepository.findById(task.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("门店不存在: " + task.getStoreId()));

        List<CountRecord> records = countRecordRepository.findByTaskIdOrderById(taskId);
        for (CountRecord record : records) {
            if (record.getDiffQuantity() != 0) {
                Inventory inventory = inventoryRepository.findByStoreIdAndProductIdWithLock(store.getId(), record.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                String.format("库存不存在: storeId=%d, productId=%d", store.getId(), record.getProductId())));

                int adjustQuantity = record.getDiffQuantity();
                inventory.setQuantity(inventory.getQuantity() + adjustQuantity);
                inventoryRepository.save(inventory);

                InventoryAdjustment adjustment = new InventoryAdjustment();
                adjustment.setTaskId(taskId);
                adjustment.setRecordId(record.getId());
                adjustment.setAdjustQuantity(adjustQuantity);
                adjustment.setAdjustTime(LocalDateTime.now());
                adjustment.setOperator(operator);
                adjustment.setRemark(remark);
                adjustmentRepository.save(adjustment);
            }
        }

        task.setTaskStatus(TaskStatus.ADJUSTED);
        return countTaskRepository.save(task);
    }

    public List<InventoryWithProductVO> getInventoryForBatchImport(Long taskId, String category, String keyword) {
        CountTask task = countTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        List<CountRecord> records = countRecordRepository.findByTaskIdOrderById(taskId);
        List<Product> filteredProducts = productRepository.findByFilters(category, keyword);

        Map<Long, Product> productMap = filteredProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        return records.stream()
                .filter(record -> productMap.containsKey(record.getProductId()))
                .map(record -> new InventoryWithProductVO(record, productMap.get(record.getProductId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<CountRecord> batchImportCountRecords(Long taskId, List<BatchImportItemDTO> items) {
        CountTask task = countTaskRepository.findByIdWithLock(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() != TaskStatus.DRAFT && task.getTaskStatus() != TaskStatus.REVIEWING) {
            throw new BusinessException("当前任务状态不允许批量导入盘点数据");
        }

        List<CountRecord> updatedRecords = new ArrayList<>();
        for (BatchImportItemDTO item : items) {
            CountRecord record = countRecordRepository.findById(item.getRecordId())
                    .orElseThrow(() -> new IllegalArgumentException("盘点记录不存在: " + item.getRecordId()));

            if (!record.getTaskId().equals(taskId)) {
                throw new BusinessException("盘点记录不属于当前任务: " + item.getRecordId());
            }

            if (Boolean.TRUE.equals(record.getReadOnly())) {
                throw new BusinessException("盘点记录已只读，无法修改: " + item.getRecordId());
            }

            int diffQuantity = item.getCountedQuantity() - record.getSystemQuantity();
            BigDecimal diffAmount = BigDecimal.valueOf(diffQuantity).multiply(record.getUnitPrice());

            record.setCountedQuantity(item.getCountedQuantity());
            record.setDiffQuantity(diffQuantity);
            record.setDiffAmount(diffAmount);

            updatedRecords.add(countRecordRepository.save(record));
        }

        recalculateTotalDiffAmount(taskId);
        return updatedRecords;
    }

    @Transactional
    public CountTask closeTask(Long taskId) {
        CountTask task = countTaskRepository.findByIdWithLock(taskId)
                .orElseThrow(() -> new IllegalArgumentException("盘点任务不存在: " + taskId));

        if (task.getTaskStatus() != TaskStatus.ADJUSTED && task.getTaskStatus() != TaskStatus.SUBMITTED) {
            throw new BusinessException("当前任务状态不允许关闭");
        }

        countRecordRepository.updateReadOnlyByTaskId(taskId, true);

        task.setTaskStatus(TaskStatus.CLOSED);
        task.setCloseTime(LocalDateTime.now());
        return countTaskRepository.save(task);
    }

    private void recalculateTotalDiffAmount(Long taskId) {
        BigDecimal total = calculateTotalDiffAmount(taskId);
        CountTask task = countTaskRepository.findById(taskId).orElseThrow();
        task.setTotalDiffAmount(total);
        countTaskRepository.save(task);
    }

    private BigDecimal calculateTotalDiffAmount(Long taskId) {
        List<CountRecord> records = countRecordRepository.findByTaskIdOrderById(taskId);
        return records.stream()
                .map(r -> r.getDiffAmount().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String generateTaskNo() {
        String prefix = "PD" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = countTaskRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }
}
