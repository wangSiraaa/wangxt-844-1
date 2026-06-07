package com.inventory.repository;

import com.inventory.entity.CountTask;
import com.inventory.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface CountTaskRepository extends JpaRepository<CountTask, Long> {
    List<CountTask> findByStoreIdOrderByCreatedTimeDesc(Long storeId);

    List<CountTask> findByTaskStatusOrderByCreatedTimeDesc(TaskStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM CountTask t WHERE t.id = :id")
    Optional<CountTask> findByIdWithLock(@Param("id") Long id);
}
