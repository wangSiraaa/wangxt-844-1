package com.inventory.service;

import com.inventory.entity.Store;
import com.inventory.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public Store getStoreById(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("门店不存在: " + id));
    }

    public Store updateThreshold(Long id, java.math.BigDecimal threshold) {
        Store store = getStoreById(id);
        store.setThresholdAmount(threshold);
        return storeRepository.save(store);
    }
}
