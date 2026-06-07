package com.inventory.controller;

import com.inventory.common.Result;
import com.inventory.entity.Store;
import com.inventory.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping
    public Result<List<Store>> getAllStores() {
        return Result.success(storeService.getAllStores());
    }

    @GetMapping("/{id}")
    public Result<Store> getStoreById(@PathVariable Long id) {
        return Result.success(storeService.getStoreById(id));
    }

    @PutMapping("/{id}/threshold")
    public Result<Store> updateThreshold(@PathVariable Long id, @RequestParam BigDecimal threshold) {
        return Result.success(storeService.updateThreshold(id, threshold));
    }
}
