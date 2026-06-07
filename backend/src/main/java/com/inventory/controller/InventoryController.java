package com.inventory.controller;

import com.inventory.common.Result;
import com.inventory.entity.Inventory;
import com.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public Result<List<Inventory>> getInventoryByStoreId(@RequestParam Long storeId) {
        return Result.success(inventoryService.getInventoryByStoreId(storeId));
    }

    @GetMapping("/{storeId}/{productId}")
    public Result<Inventory> getInventory(@PathVariable Long storeId, @PathVariable Long productId) {
        return Result.success(inventoryService.getInventory(storeId, productId));
    }
}
