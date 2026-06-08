package com.inventory.dto;

import com.inventory.entity.CountRecord;
import com.inventory.entity.CountTask;
import lombok.Data;

import java.util.List;

@Data
public class CountTaskDetailVO {
    private CountTask task;
    private List<CountRecord> records;

    public CountTask getTask() {
        return task;
    }

    public void setTask(CountTask task) {
        this.task = task;
    }

    public List<CountRecord> getRecords() {
        return records;
    }

    public void setRecords(List<CountRecord> records) {
        this.records = records;
    }
}
