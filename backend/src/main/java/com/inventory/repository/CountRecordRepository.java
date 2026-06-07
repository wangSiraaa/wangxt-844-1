package com.inventory.repository;

import com.inventory.entity.CountRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountRecordRepository extends JpaRepository<CountRecord, Long> {
    List<CountRecord> findByTaskIdOrderById(Long taskId);

    Optional<CountRecord> findByTaskIdAndProductId(Long taskId, Long productId);

    @Modifying
    @Query("UPDATE CountRecord r SET r.readOnly = :readOnly WHERE r.taskId = :taskId")
    int updateReadOnlyByTaskId(@Param("taskId") Long taskId, @Param("readOnly") Boolean readOnly);
}
