-- 门店表
CREATE TABLE IF NOT EXISTS store (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '门店名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '门店编码',
    address VARCHAR(255) COMMENT '门店地址',
    manager_name VARCHAR(50) COMMENT '店长姓名',
    threshold_amount DECIMAL(12,2) DEFAULT 10000.00 COMMENT '差异阈值金额，超过则需要区域复盘',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店';

-- 商品表
CREATE TABLE IF NOT EXISTS product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL COMMENT '商品SKU',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    category VARCHAR(50) COMMENT '商品分类',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价',
    unit VARCHAR(20) DEFAULT '件' COMMENT '计量单位',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品';

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL COMMENT '门店ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 0 COMMENT '系统库存数量',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 0 COMMENT '乐观锁版本',
    UNIQUE KEY uk_store_product (store_id, product_id),
    CONSTRAINT fk_inventory_store FOREIGN KEY (store_id) REFERENCES store(id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存';

-- 盘点任务表
CREATE TABLE IF NOT EXISTS count_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL COMMENT '门店ID',
    task_no VARCHAR(50) UNIQUE NOT NULL COMMENT '任务编号',
    task_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '任务状态：DRAFT-草稿, SUBMITTED-已提交, REVIEWING-待复盘, REVIEWED-已复盘, ADJUSTED-已调账, CLOSED-已关闭',
    total_diff_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '总差异金额',
    submit_time DATETIME COMMENT '提交时间',
    close_time DATETIME COMMENT '关闭时间',
    created_by VARCHAR(50) COMMENT '创建人',
    remark VARCHAR(500) COMMENT '备注',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_count_task_store FOREIGN KEY (store_id) REFERENCES store(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点任务';

-- 盘点记录表
CREATE TABLE IF NOT EXISTS count_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '盘点任务ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    system_quantity INT NOT NULL DEFAULT 0 COMMENT '系统数量',
    counted_quantity INT NOT NULL DEFAULT 0 COMMENT '盘点数量',
    diff_quantity INT NOT NULL DEFAULT 0 COMMENT '差异数量',
    diff_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '差异金额',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价',
    is_read_only TINYINT(1) DEFAULT 0 COMMENT '是否只读：0-否，1-是',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_task_product (task_id, product_id),
    CONSTRAINT fk_count_record_task FOREIGN KEY (task_id) REFERENCES count_task(id),
    CONSTRAINT fk_count_record_product FOREIGN KEY (product_id) REFERENCES product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点记录';

-- 差异复盘表
CREATE TABLE IF NOT EXISTS difference_review (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '盘点任务ID',
    record_id BIGINT NOT NULL COMMENT '盘点记录ID',
    reviewer VARCHAR(50) NOT NULL COMMENT '复盘人',
    review_time DATETIME COMMENT '复盘时间',
    review_result VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '复盘结果：PENDING-待处理, APPROVED-通过, REJECTED-驳回',
    review_comment VARCHAR(500) COMMENT '复盘意见',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_task FOREIGN KEY (task_id) REFERENCES count_task(id),
    CONSTRAINT fk_review_record FOREIGN KEY (record_id) REFERENCES count_record(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='差异复盘';

-- 库存调账表
CREATE TABLE IF NOT EXISTS inventory_adjustment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '盘点任务ID',
    record_id BIGINT NOT NULL COMMENT '盘点记录ID',
    adjust_quantity INT NOT NULL COMMENT '调整数量',
    adjust_time DATETIME COMMENT '调整时间',
    operator VARCHAR(50) COMMENT '操作人',
    remark VARCHAR(500) COMMENT '备注',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adjustment_task FOREIGN KEY (task_id) REFERENCES count_task(id),
    CONSTRAINT fk_adjustment_record FOREIGN KEY (record_id) REFERENCES count_record(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存调账';

-- 初始化测试数据
INSERT INTO store (name, code, address, manager_name, threshold_amount) VALUES
('朝阳路店', 'ST001', '北京市朝阳区朝阳路1号', '张三', 10000.00),
('海淀店', 'ST002', '北京市海淀区海淀大街2号', '李四', 8000.00),
('西城店', 'ST003', '北京市西城区西城街3号', '王五', 5000.00)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO product (sku, name, category, unit_price, unit) VALUES
('SKU001', '苹果', '生鲜', 5.50, '斤'),
('SKU002', '牛奶', '食品', 68.00, '箱'),
('SKU003', '大米', '食品', 120.00, '袋'),
('SKU004', '食用油', '食品', 89.00, '桶'),
('SKU005', '洗衣液', '日用', 35.00, '瓶'),
('SKU006', '卫生纸', '日用', 28.00, '提'),
('SKU007', '矿泉水', '饮料', 2.50, '瓶'),
('SKU008', '啤酒', '饮料', 85.00, '箱'),
('SKU009', '笔记本电脑', '数码', 5999.00, '台'),
('SKU010', '智能手机', '数码', 3999.00, '台')
ON DUPLICATE KEY UPDATE id=id;

-- 初始化库存数据
INSERT INTO inventory (store_id, product_id, quantity) VALUES
(1, 1, 200), (1, 2, 150), (1, 3, 100), (1, 4, 80), (1, 5, 300),
(1, 6, 250), (1, 7, 500), (1, 8, 120), (1, 9, 10), (1, 10, 15),
(2, 1, 180), (2, 2, 130), (2, 3, 90), (2, 4, 70), (2, 5, 280),
(2, 6, 220), (2, 7, 450), (2, 8, 100), (2, 9, 8), (2, 10, 12),
(3, 1, 160), (3, 2, 110), (3, 3, 80), (3, 4, 60), (3, 5, 260),
(3, 6, 200), (3, 7, 400), (3, 8, 90), (3, 9, 6), (3, 10, 10)
ON DUPLICATE KEY UPDATE id=id;
