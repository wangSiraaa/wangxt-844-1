package com.inventory.service;

import com.inventory.entity.Inventory;
import com.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public List<Inventory> getInventoryByStoreId(Long storeId) {
        return inventoryRepository.findByStoreId(storeId);
    }

    public Inventory getInventory(Long storeId, Long productId) {
        return inventoryRepository.findByStoreIdAndProductId(storeId, productId)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("库存不存在: storeId=%d, productId=%d", storeId, productId)));
    }

    @Transactional
    public void adjustInventory(Long storeId, Long productId, int adjustQuantity) {
        Inventory inventory = inventoryRepository.findByStoreIdAndProductIdWithLock(storeId, productId)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("库存不存在: storeId=%d, productId=%d", storeId, productId)));
        inventory.setQuantity(inventory.getQuantity() + adjustQuantity);
        inventoryRepository.save(inventory);
    }
}
