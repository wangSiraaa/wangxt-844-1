package com.inventory.controller;

import com.inventory.common.Result;
import com.inventory.dto.AdjustmentDTO;
import com.inventory.dto.BatchImportDTO;
import com.inventory.dto.CountTaskDetailVO;
import com.inventory.dto.CreateCountTaskDTO;
import com.inventory.dto.InventoryWithProductVO;
import com.inventory.dto.ReviewDTO;
import com.inventory.dto.UpdateCountRecordDTO;
import com.inventory.entity.CountRecord;
import com.inventory.entity.CountTask;
import com.inventory.enums.TaskStatus;
import com.inventory.service.CountTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/count-tasks")
@RequiredArgsConstructor
@Tag(name = "盘点任务管理", description = "盘点任务的创建、提交、复盘、调账、关闭等操作")
public class CountTaskController {

    private final CountTaskService countTaskService;

    @GetMapping
    @Operation(summary = "查询盘点任务列表")
    public Result<List<CountTask>> getTasks(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) TaskStatus status) {
        if (storeId != null) {
            return Result.success(countTaskService.getTasksByStoreId(storeId));
        }
        if (status != null) {
            return Result.success(countTaskService.getTasksByStatus(status));
        }
        return Result.error("请指定storeId或status");
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "查询盘点任务详情（含盘点记录）")
    public Result<CountTaskDetailVO> getTaskDetail(@PathVariable Long taskId) {
        return Result.success(countTaskService.getTaskDetail(taskId));
    }

    @PostMapping
    @Operation(summary = "创建盘点任务", description = "门店店长创建盘点任务，自动拉取当前门店库存作为基准")
    public Result<CountTask> createTask(@Valid @RequestBody CreateCountTaskDTO dto) {
        return Result.success(countTaskService.createCountTask(dto));
    }

    @PutMapping("/records")
    @Operation(summary = "更新盘点记录", description = "录入实际盘点数量，自动计算差异")
    public Result<CountRecord> updateRecord(@Valid @RequestBody UpdateCountRecordDTO dto) {
        return Result.success(countTaskService.updateCountRecord(dto.getRecordId(), dto.getCountedQuantity()));
    }

    @PostMapping("/{taskId}/submit")
    @Operation(summary = "提交盘点任务", description = "提交后系统自动判断：差异超阈值进入复盘状态，否则直接进入已提交状态")
    public Result<CountTask> submitTask(@PathVariable Long taskId) {
        return Result.success(countTaskService.submitTask(taskId));
    }

    @PostMapping("/review")
    @Operation(summary = "区域复盘", description = "区域经理对超阈值差异进行复盘，通过后方可调账")
    public Result<CountTask> reviewTask(@Valid @RequestBody ReviewDTO dto) {
        return Result.success(countTaskService.reviewTask(
                dto.getTaskId(), dto.getReviewer(), dto.getReviewResult(), dto.getReviewComment()));
    }

    @PostMapping("/adjust")
    @Operation(summary = "库存调账", description = "根据盘点差异调整系统库存，必须先完成复盘")
    public Result<CountTask> adjustInventory(@Valid @RequestBody AdjustmentDTO dto) {
        return Result.success(countTaskService.adjustInventory(
                dto.getTaskId(), dto.getOperator(), dto.getRemark()));
    }

    @GetMapping("/{taskId}/batch-import")
    @Operation(summary = "获取批量导入数据", description = "根据筛选条件获取当前任务的商品库存盘点数据，用于批量导入")
    public Result<List<InventoryWithProductVO>> getBatchImportData(
            @PathVariable Long taskId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return Result.success(countTaskService.getInventoryForBatchImport(taskId, category, keyword));
    }

    @PostMapping("/{taskId}/batch-import")
    @Operation(summary = "批量导入盘点数据", description = "批量更新多个商品的盘点数量，自动计算差异")
    public Result<List<CountRecord>> batchImport(
            @PathVariable Long taskId,
            @Valid @RequestBody BatchImportDTO dto) {
        return Result.success(countTaskService.batchImportCountRecords(taskId, dto.getItems()));
    }

    @PostMapping("/{taskId}/close")
    @Operation(summary = "关闭盘点任务", description = "关闭后所有盘点记录变为只读，无法再修改")
    public Result<CountTask> closeTask(@PathVariable Long taskId) {
        return Result.success(countTaskService.closeTask(taskId));
    }
}
