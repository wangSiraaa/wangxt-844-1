#!/bin/bash
set -e

BASE_URL="http://localhost:8084/api"

echo "=========================================="
echo "连锁门店盘点差异处理 - 高金额差异复盘流程测试"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass_count=0
fail_count=0

check_response() {
    local response="$1"
    local expected_code="$2"
    local test_name="$3"
    
    actual_code=$(echo "$response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ "$actual_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo "  期望 code=$expected_code, 实际 code=$actual_code"
        echo "  响应: $response"
        fail_count=$((fail_count + 1))
        return 1
    fi
}

extract_field() {
    local response="$1"
    local field="$2"
    echo "$response" | grep -o "\"$field\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

extract_num_field() {
    local response="$1"
    local field="$2"
    echo "$response" | grep -o "\"$field\":[0-9.]*" | head -1 | cut -d':' -f2
}

echo -e "${YELLOW}步骤 1: 检查后端服务健康状态${NC}"
echo "------------------------------------------"
response=$(curl -s "$BASE_URL/health")
health_status=$(echo "$response" | grep -o '"status":"[^\"]*"' | cut -d'"' -f4)
if [ "$health_status" = "UP" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 后端服务运行正常"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 后端服务未就绪，请先启动容器"
    echo "  响应: $response"
    exit 1
fi
echo ""

echo -e "${YELLOW}步骤 2: 获取门店列表${NC}"
echo "------------------------------------------"
stores_response=$(curl -s "$BASE_URL/stores")
check_response "$stores_response" "200" "获取门店列表"
echo "  门店列表:"
echo "$stores_response" | python3 -m json.tool 2>/dev/null | grep -A2 '"name"' | grep -v '^--$' || echo "$stores_response"
echo ""

echo -e "${YELLOW}步骤 3: 获取商品列表${NC}"
echo "------------------------------------------"
products_response=$(curl -s "$BASE_URL/products")
check_response "$products_response" "200" "获取商品列表"
echo "  高价值商品:"
echo "$products_response" | python3 -m json.tool 2>/dev/null | grep -E '"name"|"unitPrice"' | paste - - | head -5 || echo "$products_response"
echo ""

echo -e "${YELLOW}步骤 4: 创建盘点任务（西城店 ST003，阈值¥5000）${NC}"
echo "------------------------------------------"
create_response=$(curl -s -X POST "$BASE_URL/count-tasks" \
    -H "Content-Type: application/json" \
    -d '{"storeId": 3, "createdBy": "测试店长", "remark": "自动化测试-高金额差异复盘流程"}')
check_response "$create_response" "200" "创建盘点任务"
task_id=$(extract_num_field "$create_response" "id")
task_no=$(extract_field "$create_response" "taskNo")
task_status=$(extract_field "$create_response" "taskStatus")
echo "  任务ID: $task_id"
echo "  任务编号: $task_no"
echo "  任务状态: $task_status"
echo ""

echo -e "${YELLOW}步骤 5: 获取任务详情（含盘点记录）${NC}"
echo "------------------------------------------"
detail_response=$(curl -s "$BASE_URL/count-tasks/$task_id")
check_response "$detail_response" "200" "获取任务详情"

records=$(echo "$detail_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']['records']
for r in records:
    if r['productId'] in [9, 10]:  # 笔记本电脑和智能手机
        print(f\"{r['id']}|{r['productId']}|{r['systemQuantity']}|{r['unitPrice']}\")
" 2>/dev/null)

echo "  高价值商品记录:"
laptop_record_id=""
phone_record_id=""
while IFS='|' read -r rec_id prod_id sys_qty price; do
    if [ "$prod_id" = "9" ]; then
        laptop_record_id=$rec_id
        echo "    笔记本电脑: 记录ID=$rec_id, 系统库存=$sys_qty, 单价=¥$price"
    elif [ "$prod_id" = "10" ]; then
        phone_record_id=$rec_id
        echo "    智能手机: 记录ID=$rec_id, 系统库存=$sys_qty, 单价=¥$price"
    fi
done <<< "$records"
echo ""

echo -e "${YELLOW}步骤 6: 录入高金额差异（差异金额超过阈值¥5000）${NC}"
echo "------------------------------------------"
# 从任务详情中动态获取实际系统库存数量，并设置盘点数量使差异超过阈值
# 笔记本电脑: 单价¥5999，少2台即差异¥11998
# 智能手机: 单价¥3999，少2台即差异¥7998

laptop_system_qty=$(echo "$detail_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']['records']
for r in records:
    if r['productId'] == 9:
        print(r['systemQuantity'])
        break
" 2>/dev/null)

phone_system_qty=$(echo "$detail_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']['records']
for r in records:
    if r['productId'] == 10:
        print(r['systemQuantity'])
        break
" 2>/dev/null)

# 确保盘点数量比系统库存少，产生足够大的差异
laptop_counted_qty=$((laptop_system_qty - 2))
phone_counted_qty=$((phone_system_qty - 2))

laptop_diff=$((laptop_counted_qty - laptop_system_qty))
laptop_diff_amount=$((laptop_diff * 5999))
echo "  笔记本电脑: 系统=$laptop_system_qty台, 盘点=$laptop_counted_qty台, 差异=$laptop_diff台, 差异金额=¥$laptop_diff_amount"

update1_response=$(curl -s -X PUT "$BASE_URL/count-tasks/records" \
    -H "Content-Type: application/json" \
    -d "{\"recordId\": $laptop_record_id, \"countedQuantity\": $laptop_counted_qty}")
check_response "$update1_response" "200" "更新笔记本电脑盘点数量"

phone_diff=$((phone_counted_qty - phone_system_qty))
phone_diff_amount=$((phone_diff * 3999))
echo "  智能手机: 系统=$phone_system_qty台, 盘点=$phone_counted_qty台, 差异=$phone_diff台, 差异金额=¥$phone_diff_amount"

total_diff=$((laptop_diff_amount + phone_diff_amount))
total_diff_abs=$((total_diff < 0 ? -total_diff : total_diff))
echo "  预计总差异金额(绝对值): ¥$total_diff_abs"
echo "  门店阈值: ¥5000"
echo -e "  ${YELLOW}差异金额 ¥$total_diff_abs > 阈值 ¥5000，提交后应进入 REVIEWING 状态${NC}"

update2_response=$(curl -s -X PUT "$BASE_URL/count-tasks/records" \
    -H "Content-Type: application/json" \
    -d "{\"recordId\": $phone_record_id, \"countedQuantity\": $phone_counted_qty}")
check_response "$update2_response" "200" "更新智能手机盘点数量"
echo ""

echo -e "${YELLOW}步骤 7: 提交盘点任务${NC}"
echo "------------------------------------------"
submit_response=$(curl -s -X POST "$BASE_URL/count-tasks/$task_id/submit")
check_response "$submit_response" "200" "提交盘点任务"
submitted_status=$(extract_field "$submit_response" "taskStatus")
submitted_diff_amount=$(extract_num_field "$submit_response" "totalDiffAmount")
echo "  提交后状态: $submitted_status"
echo "  总差异金额: ¥$submitted_diff_amount"

if [ "$submitted_status" = "REVIEWING" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 差异金额超阈值，正确进入【待复盘】状态"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 期望状态 REVIEWING，实际状态 $submitted_status"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}失败用例 1: 未复盘不能调账${NC}"
echo "------------------------------------------"
adjust_response=$(curl -s -X POST "$BASE_URL/count-tasks/adjust" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "operator": "测试员", "remark": "测试未复盘调账"}')
adjust_code=$(echo "$adjust_response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
if [ "$adjust_code" != "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 未复盘状态下调账被正确拒绝"
    echo "  错误信息: $(echo "$adjust_response" | grep -o '"message":"[^\"]*"' | cut -d'"' -f4)"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 未复盘状态下不应允许调账"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 8: 区域复盘通过${NC}"
echo "------------------------------------------"
review_response=$(curl -s -X POST "$BASE_URL/count-tasks/review" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "reviewer": "区域经理", "reviewResult": "APPROVED", "reviewComment": "差异原因已核实，同意调账"}')
check_response "$review_response" "200" "区域复盘通过"
reviewed_status=$(extract_field "$review_response" "taskStatus")
echo "  复盘后状态: $reviewed_status"
if [ "$reviewed_status" = "REVIEWED" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 复盘通过，正确进入【已复盘】状态"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 期望状态 REVIEWED，实际状态 $reviewed_status"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 9: 复盘通过后进行调账${NC}"
echo "------------------------------------------"
adjust2_response=$(curl -s -X POST "$BASE_URL/count-tasks/adjust" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "operator": "财务人员", "remark": "根据复盘结果调账"}')
check_response "$adjust2_response" "200" "调账操作"
adjusted_status=$(extract_field "$adjust2_response" "taskStatus")
echo "  调账后状态: $adjusted_status"
if [ "$adjusted_status" = "ADJUSTED" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 调账成功，正确进入【已调账】状态"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 期望状态 ADJUSTED，实际状态 $adjusted_status"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 10: 关闭盘点任务${NC}"
echo "------------------------------------------"
close_response=$(curl -s -X POST "$BASE_URL/count-tasks/$task_id/close")
check_response "$close_response" "200" "关闭盘点任务"
closed_status=$(extract_field "$close_response" "taskStatus")
echo "  关闭后状态: $closed_status"
if [ "$closed_status" = "CLOSED" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 任务关闭成功，正确进入【已关闭】状态"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 期望状态 CLOSED，实际状态 $closed_status"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}失败用例 2: 任务关闭后盘点数只读${NC}"
echo "------------------------------------------"
update3_response=$(curl -s -X PUT "$BASE_URL/count-tasks/records" \
    -H "Content-Type: application/json" \
    -d "{\"recordId\": $laptop_record_id, \"countedQuantity\": 5}")
update3_code=$(echo "$update3_response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
if [ "$update3_code" != "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 任务关闭后修改记录被正确拒绝"
    echo "  错误信息: $(echo "$update3_response" | grep -o '"message":"[^\"]*"' | cut -d'"' -f4)"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 任务关闭后不应允许修改盘点记录"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 11: 验证只读标记${NC}"
echo "------------------------------------------"
detail2_response=$(curl -s "$BASE_URL/count-tasks/$task_id")
read_only_count=$(echo "$detail2_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']['records']
count = sum(1 for r in records if r.get('readOnly') == True)
print(count)
" 2>/dev/null)
total_records=$(echo "$detail2_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data['data']['records']))
" 2>/dev/null)
echo "  总记录数: $total_records"
echo "  只读记录数: $read_only_count"
if [ "$read_only_count" = "$total_records" ] && [ "$read_only_count" != "0" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 所有记录已正确标记为只读"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 记录只读标记不正确"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}失败用例 3: 验证数据库追踪差异单${NC}"
echo "------------------------------------------"
echo "  查询复盘记录:"
mysql_response=$(docker exec inventory-mysql mysql -uinventory -pinventory123 inventory_db -e "
SELECT id, task_id, reviewer, review_result, review_comment 
FROM difference_review 
WHERE task_id = $task_id;
" 2>/dev/null || echo "  (注意: 需确保MySQL容器名称正确)")
echo "$mysql_response"
echo ""

echo "  查询调账记录:"
adjust_mysql_response=$(docker exec inventory-mysql mysql -uinventory -pinventory123 inventory_db -e "
SELECT id, task_id, record_id, adjust_quantity, operator 
FROM inventory_adjustment 
WHERE task_id = $task_id;
" 2>/dev/null || echo "  (注意: 需确保MySQL容器名称正确)")
echo "$adjust_mysql_response"
echo ""

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $pass_count${NC}"
echo -e "${RED}失败: $fail_count${NC}"
echo "=========================================="

if [ "$fail_count" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试用例通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $fail_count 个测试用例失败${NC}"
    exit 1
fi
