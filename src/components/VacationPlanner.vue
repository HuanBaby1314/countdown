<template>
  <div class="vacation-planner" v-if="recommendations.length > 0">
    <div class="section-header">
      <span class="title">🗓️ 拼好假</span>
      <span class="subtitle">请最少的假，休最长的假</span>
    </div>

    <div class="recommendation-list">
      <div 
        v-for="(item, index) in recommendations" 
        :key="index"
        class="recommendation-card"
        :class="{ 'is-expanded': expandedIndex === index }"
        @click="toggleExpand(index)"
      >
        <!-- 简短信息（始终显示） -->
        <div class="card-brief">
          <div class="brief-left">
            <span class="holiday-name">{{ item.holidayName }}</span>
            <span class="brief-summary">请{{ item.leaveCount }}休{{ item.totalVacation }}</span>
          </div>
          <div class="brief-right">
            <span class="roi-badge" :class="getRoiClass(item.roi)">
              {{ item.roi }}x
            </span>
            <span class="expand-icon">{{ expandedIndex === index ? '▼' : '▶' }}</span>
          </div>
        </div>
        
        <!-- 详细信息（展开时显示） -->
        <div v-if="expandedIndex === index" class="card-detail">
          <div class="vacation-summary">
            <div class="summary-item">
              <span class="label">请假</span>
              <span class="value leave">{{ item.leaveCount }} 天</span>
            </div>
            <span class="arrow">→</span>
            <div class="summary-item">
              <span class="label">连休</span>
              <span class="value total">{{ item.totalVacation }} 天</span>
            </div>
          </div>
          
          <div class="leave-dates">
            <span class="dates-label">请假日期：</span>
            <span class="dates-value">{{ item.leaveDatesFormatted }}</span>
          </div>
          
          <div class="vacation-range">
            <span class="range-label">假期区间：</span>
            <span class="range-value">{{ item.vacationStart }} ~ {{ item.vacationEnd }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  holidayData: {
    type: Object,
    default: null
  },
  maxLeaveBudget: {
    type: Number,
    default: 3
  }
})

// 展开的索引（默认展开第一个）
const expandedIndex = ref(0)

/**
 * 切换展开/收起
 */
const toggleExpand = (index) => {
  expandedIndex.value = expandedIndex.value === index ? -1 : index
}

/**
 * 拼假优化算法
 */
const optimizeVacation = (holidayData, maxLeaveBudget = 3) => {
  if (!holidayData?.days?.length) return []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 1. 提取所有真正的休息日并排序
  const offDays = holidayData.days
    .filter(day => day.isOffDay === true)
    .map(day => day.date)
    .sort()
  
  if (offDays.length === 0) return []
  
  // 2. 将离散的休息日合并为"假期块"
  const blocks = []
  let start = offDays[0]
  
  for (let i = 1; i <= offDays.length; i++) {
    const prev = new Date(offDays[i - 1])
    const curr = i < offDays.length ? new Date(offDays[i]) : null
    
    if (!curr || (curr - prev) / (1000 * 60 * 60 * 24) > 1) {
      const blockEnd = new Date(offDays[i - 1])
      blocks.push({
        start: start,
        end: offDays[i - 1],
        duration: (blockEnd - new Date(start)) / (1000 * 60 * 60 * 24) + 1,
        name: holidayData.days.find(d => d.date === start)?.name || '假期'
      })
      start = offDays[i]
    }
  }
  
  const recommendations = []
  
  // 3. 计算相邻假期块之间的缝隙
  for (let i = 0; i < blocks.length - 1; i++) {
    const currentEnd = new Date(blocks[i].end)
    const nextStart = new Date(blocks[i + 1].start)
    
    // 跳过已过去的假期组合（两个假期都已过去）
    const nextEnd = new Date(blocks[i + 1].end)
    if (nextEnd < today) continue
    
    // 计算两个假期之间的工作日天数
    const gapDays = (nextStart - currentEnd) / (1000 * 60 * 60 * 24) - 1
    
    if (gapDays > 0 && gapDays <= maxLeaveBudget) {
      const leaveDates = []
      for (let d = 1; d <= gapDays; d++) {
        const leaveDate = new Date(currentEnd)
        leaveDate.setDate(currentEnd.getDate() + d)
        leaveDates.push(leaveDate.toISOString().split('T')[0])
      }
      
      const totalDays = blocks[i].duration + gapDays + blocks[i + 1].duration
      const vacationStart = new Date(blocks[i].start)
      const vacationEnd = new Date(blocks[i + 1].end)
      
      const formatDate = (date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`
      }
      
      const formatLeaveDates = (dates) => {
        return dates.map(d => {
          const date = new Date(d)
          const weekDays = ['日', '一', '二', '三', '四', '五', '六']
          return `${date.getMonth() + 1}/${date.getDate()}(周${weekDays[date.getDay()]})`
        }).join('、')
      }
      
      // 判断是跨假期拼假还是周末拼假
      const isWeekend = blocks[i].name === blocks[i + 1].name
      const holidayName = isWeekend 
        ? `${blocks[i].name}+周末` 
        : `${blocks[i].name}+${blocks[i + 1].name}`
      
      recommendations.push({
        holidayName,
        leaveDates,
        leaveDatesFormatted: formatLeaveDates(leaveDates),
        leaveCount: gapDays,
        totalVacation: totalDays,
        vacationStart: formatDate(vacationStart),
        vacationEnd: formatDate(vacationEnd),
        roi: (totalDays / gapDays).toFixed(1),
        // 用于排序：取假期开始日期
        startDate: new Date(blocks[i].start)
      })
    }
  }
  
  // 4. 按假期开始日期排序（最近的在前）
  recommendations.sort((a, b) => a.startDate - b.startDate)
  
  return recommendations
}

/**
 * 计算拼假建议
 */
const recommendations = computed(() => {
  const result = optimizeVacation(props.holidayData, props.maxLeaveBudget)
  // 默认展开第一个（最近的）
  if (result.length > 0 && expandedIndex.value === -1) {
    expandedIndex.value = 0
  }
  return result
})

/**
 * 获取性价比样式类
 */
const getRoiClass = (roi) => {
  const value = parseFloat(roi)
  if (value >= 5) return 'roi-excellent'
  if (value >= 3) return 'roi-good'
  return 'roi-normal'
}
</script>

<style scoped>
.vacation-planner {
  margin-top: 16px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.section-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.section-header .subtitle {
  font-size: 12px;
  color: #909399;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.recommendation-card:hover {
  border-color: #c6e2ff;
}

.recommendation-card.is-expanded {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

/* 简短信息 */
.card-brief {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #fafafa;
}

.brief-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.holiday-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.brief-summary {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.brief-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.roi-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  color: #fff;
}

.roi-excellent {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
}

.roi-good {
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
}

.roi-normal {
  background: #909399;
}

.expand-icon {
  font-size: 10px;
  color: #c0c4cc;
  transition: transform 0.2s;
}

/* 详细信息 */
.card-detail {
  padding: 12px 14px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}

.vacation-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 20px;
  font-weight: 700;
}

.summary-item .leave {
  color: #e6a23c;
}

.summary-item .total {
  color: #67c23a;
}

.arrow {
  font-size: 18px;
  color: #c0c4cc;
}

.leave-dates,
.vacation-range {
  font-size: 13px;
  color: #606266;
  margin-top: 8px;
  line-height: 1.5;
}

.dates-label,
.range-label {
  color: #909399;
}

.dates-value {
  color: #e6a23c;
  font-weight: 500;
}

.range-value {
  color: #409eff;
  font-weight: 500;
}
</style>
