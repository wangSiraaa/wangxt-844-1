package com.inventory.repository;

import com.inventory.entity.DifferenceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DifferenceReviewRepository extends JpaRepository<DifferenceReview, Long> {
    List<DifferenceReview> findByTaskIdOrderByCreatedTimeDesc(Long taskId);
}
