package com.inventory.repository;

import com.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByStoreId(Long storeId);

    Optional<Inventory> findByStoreIdAndProductId(Long storeId, Long productId);

    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT i FROM Inventory i WHERE i.storeId = :storeId AND i.productId = :productId")
    Optional<Inventory> findByStoreIdAndProductIdWithLock(@Param("storeId") Long storeId, @Param("productId") Long productId);
}
