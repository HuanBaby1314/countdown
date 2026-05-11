<template>
  <div class="lunar-calendar">
    <!-- Element 日历 -->
    <el-calendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div class="cal-cell" :class="{ today: isToday(data), selected: isSelected(data) }" @click="handleSelect(data)">
          <span class="cell-day">{{ data.day.split('-')[2] - 0 }}</span>
          <span class="cell-text" :class="{ holiday: isHoliday(data) }">{{ getDateText(data) }}</span>
        </div>
      </template>
    </el-calendar>
    
    <!-- 日期详情 -->
    <div v-if="detail && selectedInfo" class="cal-detail">
      <div class="detail-header">
        <span class="detail-date">{{ selectedInfo.month }}月{{ selectedInfo.day }}日</span>
        <span class="detail-weekday">星期{{ selectedInfo.weekday }}</span>
      </div>
      <div v-if="selectedInfo.lunar" class="detail-row">
        <span class="detail-label">农历</span>
        <span class="detail-value">{{ selectedInfo.lunar.fullStr }} {{ selectedInfo.lunar.ganZhi }}年【{{ selectedInfo.lunar.animal }}】</span>
      </div>
      <div v-if="selectedInfo.holiday" class="detail-row holiday">
        <span class="detail-label">节日</span>
        <span class="detail-value">{{ selectedInfo.holiday }}</span>
      </div>
      <div v-if="selectedInfo.term" class="detail-row">
        <span class="detail-label">节气</span>
        <span class="detail-value">{{ selectedInfo.term }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getDateInfo, getSolarTerm } from '../utils/lunar'

const props = defineProps({
  detail: { type: Boolean, default: false },
  modelValue: { type: Date, default: () => new Date() }
})

const emit = defineEmits(['select', 'update:modelValue'])

const currentDate = ref(new Date(props.modelValue))
const selectedInfo = ref(null)

// 日期信息缓存
const dateInfoCache = new Map()

/**
 * 获取日期信息（带缓存）
 */
const getDateInfoCached = (year, month, day) => {
  const key = `${year}-${month}-${day}`
  if (!dateInfoCache.has(key)) {
    dateInfoCache.set(key, getDateInfo(year, month, day))
  }
  return dateInfoCache.get(key)
}

/**
 * 解析日期字符串
 */
const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

/**
 * 获取日期显示文本
 */
const getDateText = (data) => {
  const { year, month, day } = parseDate(data.day)
  const info = getDateInfoCached(year, month, day)
  return info.displayText || ''
}

/**
 * 判断是否是今天
 */
const isToday = (data) => {
  return data.isCurrentMonth && data.day === formatDate(new Date())
}

/**
 * 判断是否是选中日期
 */
const isSelected = (data) => {
  return selectedInfo.value && data.day === selectedInfo.value.dateStr
}

/**
 * 判断是否是节假日
 */
const isHoliday = (data) => {
  const { year, month, day } = parseDate(data.day)
  const info = getDateInfoCached(year, month, day)
  return !!info.holiday
}

/**
 * 格式化日期
 */
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 选择日期
 */
const handleSelect = (data) => {
  const { year, month, day } = parseDate(data.day)
  const info = getDateInfoCached(year, month, day)
  const term = getSolarTerm(year, month, day)
  const weekNames = ['日', '一', '二', '三', '四', '五', '六']
  const date = new Date(year, month - 1, day)
  
  selectedInfo.value = {
    year,
    month,
    day,
    dateStr: data.day,
    weekday: weekNames[date.getDay()],
    lunar: info.lunar,
    holiday: info.holiday,
    term: term || null
  }
  
  emit('select', selectedInfo.value)
}

// 监听日期变化
watch(currentDate, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.modelValue, (val) => {
  if (val) currentDate.value = new Date(val)
})
</script>

<style scoped>
.lunar-calendar {
  background: #fff;
}

:deep(.el-calendar) {
  border: none;
}

:deep(.el-calendar__header) {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-calendar__title) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-calendar-table) {
  table-layout: fixed;
}

:deep(.el-calendar-table thead th) {
  padding: 8px 0;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

:deep(.el-calendar-table td) {
  border: none;
  border-bottom: 1px solid #f2f3f5;
}

:deep(.el-calendar-day) {
  padding: 0 !important;
  height: auto !important;
}

:deep(.el-calendar-table .is-today .el-calendar-day) {
  background: #ecf5ff;
}

:deep(.el-calendar-table td.prev),
:deep(.el-calendar-table td.next) {
  opacity: 0.35;
}

/* 日期单元格 */
.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 2px;
  min-height: 46px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
}

.cal-cell:hover {
  background: #f5f7fa;
}

.cal-cell.today .cell-day {
  color: #409eff;
  font-weight: 700;
}

.cal-cell.selected {
  background: #409eff;
}

.cal-cell.selected .cell-day {
  color: #fff;
}

.cal-cell.selected .cell-text {
  color: #fff;
  opacity: 0.8;
}

.cell-day {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.cell-text {
  font-size: 10px;
  color: #909399;
  line-height: 1.2;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.cell-text.holiday {
  color: #f56c6c;
  font-weight: 500;
}

/* 详情区域 */
.cal-detail {
  padding: 12px;
  border-top: 1px solid #ebeef5;
}

.detail-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.detail-date {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-weekday {
  font-size: 13px;
  color: #909399;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-row.holiday {
  background: linear-gradient(135deg, #fff8e1, #fff3e0);
  border: 1px solid #ffcc80;
}

.detail-label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: #303133;
}

.detail-row.holiday .detail-value {
  color: #e65100;
  font-weight: 600;
}
</style>
