package com.inventory.dto;

import com.inventory.entity.CountRecord;
import com.inventory.entity.CountTask;
import lombok.Data;

import java.util.List;

@Data
public class CountTaskDetailVO {
    private CountTask task;
    private List<CountRecord> records;
}
