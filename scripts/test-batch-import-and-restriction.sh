#!/bin/bash
set -e

BASE_URL="http://localhost:8084/api"

echo "=========================================="
echo "批量导入功能 & 未复盘不能调账限制 - 综合测试"
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

echo -e "${YELLOW}步骤 2: 创建盘点任务（西城店 ST003，阈值¥5000）${NC}"
echo "------------------------------------------"
create_response=$(curl -s -X POST "$BASE_URL/count-tasks" \
    -H "Content-Type: application/json" \
    -d '{"storeId": 3, "createdBy": "测试店长", "remark": "自动化测试-批量导入与限制验证"}')
check_response "$create_response" "200" "创建盘点任务"
task_id=$(extract_num_field "$create_response" "id")
task_no=$(extract_field "$create_response" "taskNo")
task_status=$(extract_field "$create_response" "taskStatus")
echo "  任务ID: $task_id"
echo "  任务编号: $task_no"
echo "  任务状态: $task_status"
echo ""

echo -e "${YELLOW}步骤 3: 获取批量导入数据（无筛选）${NC}"
echo "------------------------------------------"
batch_data_response=$(curl -s "$BASE_URL/count-tasks/$task_id/batch-import")
check_response "$batch_data_response" "200" "获取批量导入数据（无筛选）"
record_count=$(echo "$batch_data_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data['data']))
" 2>/dev/null || echo "0")
echo "  返回记录数: $record_count"
echo "  数据一致性验证: 系统库存应与任务详情一致"

# 验证数据一致性：获取任务详情并对比
detail_response=$(curl -s "$BASE_URL/count-tasks/$task_id")
detail_count=$(echo "$detail_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data['data']['records']))
" 2>/dev/null || echo "0")

if [ "$record_count" = "$detail_count" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 批量导入数据与任务详情记录数一致 ($record_count 条)"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 数据不一致，批量导入: $record_count 条, 任务详情: $detail_count 条"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 4: 按筛选条件获取批量导入数据${NC}"
echo "------------------------------------------"
echo "  筛选: 分类=数码"
batch_filter_response=$(curl -s "$BASE_URL/count-tasks/$task_id/batch-import?category=数码")
check_response "$batch_filter_response" "200" "获取批量导入数据（按分类筛选）"
filtered_count=$(echo "$batch_filter_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
print(len(records))
print(all(r['category'] == '数码' for r in records))
" 2>/dev/null || echo "0")
filtered_count_num=$(echo "$filtered_count" | head -1)
all_digital=$(echo "$filtered_count" | tail -1)
echo "  筛选后记录数: $filtered_count_num"
if [ "$all_digital" = "True" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 分类筛选正确，所有记录均为数码类"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 分类筛选结果不正确"
    fail_count=$((fail_count + 1))
fi

echo ""
echo "  筛选: 关键词=SKU001"
batch_keyword_response=$(curl -s "$BASE_URL/count-tasks/$task_id/batch-import?keyword=SKU001")
check_response "$batch_keyword_response" "200" "获取批量导入数据（按关键词筛选）"
keyword_count=$(echo "$batch_keyword_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
print(len(records))
print(all('SKU001' in r['sku'] or '苹果' in r['productName'] for r in records))
" 2>/dev/null || echo "0")
keyword_count_num=$(echo "$keyword_count" | head -1)
all_match=$(echo "$keyword_count" | tail -1)
echo "  关键词筛选后记录数: $keyword_count_num"
if [ "$all_match" = "True" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 关键词筛选正确"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 关键词筛选结果不正确"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 5: 批量导入盘点数据（设置高金额差异）${NC}"
echo "------------------------------------------"
# 获取数码类商品的记录ID
laptop_record_id=$(echo "$batch_filter_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
for r in records:
    if r['sku'] == 'SKU009':
        print(r['recordId'])
        break
" 2>/dev/null || echo "")

phone_record_id=$(echo "$batch_filter_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
for r in records:
    if r['sku'] == 'SKU010':
        print(r['recordId'])
        break
" 2>/dev/null || echo "")

# 获取系统库存数量
laptop_sys_qty=$(echo "$batch_filter_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
for r in records:
    if r['sku'] == 'SKU009':
        print(r['systemQuantity'])
        break
" 2>/dev/null || echo "0")

phone_sys_qty=$(echo "$batch_filter_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']
for r in records:
    if r['sku'] == 'SKU010':
        print(r['systemQuantity'])
        break
" 2>/dev/null || echo "0")

laptop_counted=$((laptop_sys_qty - 2))
phone_counted=$((phone_sys_qty - 2))

echo "  笔记本电脑: 系统=$laptop_sys_qty, 盘点=$laptop_counted, 记录ID=$laptop_record_id"
echo "  智能手机: 系统=$phone_sys_qty, 盘点=$phone_counted, 记录ID=$phone_record_id"

batch_import_response=$(curl -s -X POST "$BASE_URL/count-tasks/$task_id/batch-import" \
    -H "Content-Type: application/json" \
    -d "{
        \"items\": [
            {\"recordId\": $laptop_record_id, \"countedQuantity\": $laptop_counted},
            {\"recordId\": $phone_record_id, \"countedQuantity\": $phone_counted}
        ]
    }")
check_response "$batch_import_response" "200" "批量导入盘点数据"
imported_count=$(echo "$batch_import_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data['data']))
" 2>/dev/null || echo "0")
echo "  成功导入记录数: $imported_count"
echo ""

echo -e "${YELLOW}步骤 6: 验证批量导入后数据可通过原接口查询${NC}"
echo "------------------------------------------"
detail_after_import=$(curl -s "$BASE_URL/count-tasks/$task_id")
check_response "$detail_after_import" "200" "通过原接口查询任务详情"

# 验证差异数据已更新
laptop_diff_updated=$(echo "$detail_after_import" | python3 -c "
import sys, json
data = json.load(sys.stdin)
records = data['data']['records']
for r in records:
    if r['productId'] == 9:
        print(r['diffQuantity'] < 0)
        break
" 2>/dev/null || echo "False")

total_diff_amount=$(echo "$detail_after_import" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['data']['task']['totalDiffAmount'])
" 2>/dev/null || echo "0")

if [ "$laptop_diff_updated" = "True" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 批量导入的数据已反映在原接口查询中"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 批量导入的数据未在原接口中反映"
    fail_count=$((fail_count + 1))
fi
echo "  当前总差异金额: ¥$total_diff_amount"
echo ""

echo -e "${YELLOW}步骤 7: 提交盘点任务（进入待复盘状态）${NC}"
echo "------------------------------------------"
submit_response=$(curl -s -X POST "$BASE_URL/count-tasks/$task_id/submit")
check_response "$submit_response" "200" "提交盘点任务"
submitted_status=$(extract_field "$submit_response" "taskStatus")
echo "  提交后状态: $submitted_status"
if [ "$submitted_status" = "REVIEWING" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 差异超阈值，正确进入【待复盘】状态"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 期望状态 REVIEWING，实际状态 $submitted_status"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}核心验证: 未复盘不能调账 (关键限制检查)${NC}"
echo "------------------------------------------"
echo "  当前任务状态: $submitted_status"
echo "  尝试在未复盘状态下调账..."

adjust_response=$(curl -s -X POST "$BASE_URL/count-tasks/adjust" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "operator": "测试员", "remark": "测试未复盘调账"}')

adjust_code=$(echo "$adjust_response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
error_message=$(echo "$adjust_response" | grep -o '"message":"[^\"]*"' | cut -d'"' -f4)

if [ "$adjust_code" != "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 【未复盘不能调账】限制生效！"
    echo "  错误信息: $error_message"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 【未复盘不能调账】限制失效！未复盘状态下不应允许调账"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}核心验证: DRAFT状态也不能调账${NC}"
echo "------------------------------------------"
# 创建一个新任务，处于DRAFT状态
create2_response=$(curl -s -X POST "$BASE_URL/count-tasks" \
    -H "Content-Type: application/json" \
    -d '{"storeId": 1, "createdBy": "测试店长", "remark": "DRAFT状态调账测试"}')
task2_id=$(extract_num_field "$create2_response" "id")
task2_status=$(extract_field "$create2_response" "taskStatus")
echo "  新任务ID: $task2_id, 状态: $task2_status"

adjust2_response=$(curl -s -X POST "$BASE_URL/count-tasks/adjust" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task2_id', "operator": "测试员", "remark": "测试DRAFT状态调账"}')

adjust2_code=$(echo "$adjust2_response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
error2_message=$(echo "$adjust2_response" | grep -o '"message":"[^\"]*"' | cut -d'"' -f4)

if [ "$adjust2_code" != "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}: DRAFT状态下调账被正确拒绝"
    echo "  错误信息: $error2_message"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: DRAFT状态下不应允许调账"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 8: 完成复盘后调账${NC}"
echo "------------------------------------------"
review_response=$(curl -s -X POST "$BASE_URL/count-tasks/review" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "reviewer": "区域经理", "reviewResult": "APPROVED", "reviewComment": "差异原因已核实"}')
check_response "$review_response" "200" "区域复盘通过"
reviewed_status=$(extract_field "$review_response" "taskStatus")
echo "  复盘后状态: $reviewed_status"

# 复盘通过后调账应该成功
adjust3_response=$(curl -s -X POST "$BASE_URL/count-tasks/adjust" \
    -H "Content-Type: application/json" \
    -d '{"taskId": '$task_id', "operator": "财务人员", "remark": "根据复盘结果调账"}')
check_response "$adjust3_response" "200" "复盘通过后调账成功"
adjusted_status=$(extract_field "$adjust3_response" "taskStatus")
echo "  调账后状态: $adjusted_status"
if [ "$adjusted_status" = "ADJUSTED" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 复盘通过后调账正常工作"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 复盘通过后调账失败"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}核心验证: 批量导入在非编辑状态下被拒绝${NC}"
echo "------------------------------------------"
echo "  当前任务状态: $adjusted_status (ADJUSTED)"
batch_fail_response=$(curl -s -X POST "$BASE_URL/count-tasks/$task_id/batch-import" \
    -H "Content-Type: application/json" \
    -d '{"items": [{"recordId": '$laptop_record_id', "countedQuantity": 100}]}')

batch_fail_code=$(echo "$batch_fail_response" | grep -o '"code":[0-9]*' | head -1 | cut -d':' -f2)
if [ "$batch_fail_code" != "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}: 非编辑状态下批量导入被正确拒绝"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 非编辑状态下不应允许批量导入"
    fail_count=$((fail_count + 1))
fi
echo ""

echo -e "${YELLOW}步骤 9: 验证可返回任务列表${NC}"
echo "------------------------------------------"
list_response=$(curl -s "$BASE_URL/count-tasks?storeId=3")
check_response "$list_response" "200" "查询门店任务列表"
list_count=$(echo "$list_response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data['data']))
" 2>/dev/null || echo "0")
echo "  门店任务数: $list_count"
if [ "$list_count" -ge 1 ]; then
    echo -e "${GREEN}✓ PASS${NC}: 新增样例可通过原列表接口查询"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗ FAIL${NC}: 无法通过列表接口查询任务"
    fail_count=$((fail_count + 1))
fi
echo ""

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $pass_count${NC}"
echo -e "${RED}失败: $fail_count${NC}"
echo "=========================================="

if [ "$fail_count" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✓ 所有测试用例通过！"
    echo "✓ 【未复盘不能调账】限制正常工作"
    echo "✓ 批量导入功能正常工作"
    echo "✓ 新增样例可通过原接口查询"
    echo "==========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}=========================================="
    echo "✗ 有 $fail_count 个测试用例失败"
    echo "==========================================${NC}"
    exit 1
fi
