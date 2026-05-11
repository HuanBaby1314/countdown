<template>
  <div id="app">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="top-left">
        <button v-if="currentView === 'calendar'" class="back-btn" @click="currentView = 'main'">◀</button>
        <div class="top-title">{{ currentView === 'main' ? '倒计时' : '日历' }}</div>
      </div>
      <div class="top-right">
        <span class="current-time" @click="toggleCalendar">{{ dateTime }}</span>
        <span v-if="isMakeupWorkday" class="makeup-tag">⚠️补班</span>
      </div>
    </div>
    
    <!-- 主视图 -->
    <div v-show="currentView === 'main'" class="main-view">
      <div class="tab-nav">
        <div v-for="tab in tabs" :key="tab.key" class="tab-item" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-name">{{ tab.name }}</span>
        </div>
      </div>
      
      <div class="tab-content">
        <!-- 首页 -->
        <div v-show="activeTab === 'home'" class="tab-panel">
          <template v-if="isWorkDay">
            <div v-if="workStatus === 0" class="countdown-card primary">
              <div class="card-label">距离上班还有</div>
              <div class="card-timer"><span class="tb">{{ pad(onWork.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(onWork.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(onWork.seconds) }}</span></div>
            </div>
            <div v-if="workStatus === 1" class="countdown-card warning">
              <div class="card-label">距离下班还有</div>
              <div class="card-timer"><span class="tb">{{ pad(offWork.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(offWork.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(offWork.seconds) }}</span></div>
            </div>
            <div v-if="workStatus === 2" class="countdown-card success"><span class="ci">🎉</span><span class="ct">下班啦！准备回家吧！</span></div>
          </template>
          <div v-else class="countdown-card info"><span class="ci">🌴</span><span class="ct">今天不上班，好好休息！</span></div>
          
          <div v-if="showWeekend && weekend" class="countdown-card">
            <div class="card-label">距离周末</div>
            <div class="card-timer"><span class="tb">{{ weekend.days }}</span><span class="tu">天</span><span class="tb">{{ pad(weekend.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(weekend.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(weekend.seconds) }}</span></div>
          </div>
          
          <div v-if="!isPayDay" class="countdown-card">
            <div class="card-label">距离发工资</div>
            <div class="card-timer"><span class="tb">{{ payOff.days }}</span><span class="tu">天</span><span class="tb">{{ pad(payOff.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(payOff.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(payOff.seconds) }}</span></div>
          </div>
          <div v-else class="countdown-card pay-day"><span class="ci">💰</span><span class="ct">{{ payDayMessage }}</span></div>
          
          <div v-if="nextHoliday" class="countdown-card holiday">
            <div class="card-label">{{ nextHoliday.name }}（{{ nextHoliday.dateStr }}，{{ nextHoliday.duration }}天）</div>
            <div class="card-timer"><span class="tb">{{ nextHoliday.days }}</span><span class="tu">天</span><span class="tb">{{ pad(nextHoliday.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(nextHoliday.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(nextHoliday.seconds) }}</span></div>
          </div>
          
          <div v-for="ann in starredAnniversaries" :key="ann.name + ann.date" class="countdown-card anniversary" :class="{ 'is-today': ann.isToday }">
            <div class="card-label">{{ ann.icon || '⭐' }} {{ ann.name }}<span v-if="ann.years > 0" class="ay">({{ ann.years }}周年)</span><span class="ad">{{ ann.dateStr }}</span></div>
            <div v-if="ann.isToday" class="cb">{{ ann.blessing }}</div>
            <div v-else class="card-timer"><span class="tb">{{ ann.days }}</span><span class="tu">天</span><span class="tb">{{ pad(ann.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(ann.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(ann.seconds) }}</span></div>
          </div>
        </div>
        
        <!-- 假期 -->
        <div v-show="activeTab === 'holiday'" class="tab-panel">
          <div class="sh">🎉 法定节假日</div>
          <div v-for="h in holidayList" :key="h.date" class="countdown-card">
            <div class="card-label">{{ h.name }}（{{ h.dateStr }}，{{ h.duration }}天）</div>
            <div class="card-timer"><span class="tb">{{ h.days }}</span><span class="tu">天</span><span class="tb">{{ pad(h.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(h.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(h.seconds) }}</span></div>
          </div>
          <VacationPlanner :holidayData="holidayData" :maxLeaveBudget="3" />
          <div class="sh">📋 我的假期
            <el-button v-if="!showAddLeaveForm" :icon="Plus" size="small" @click="showAddLeaveForm=true" style="margin-left:auto;">添加假期</el-button>
          </div>
          
          <!-- 添加假期表单 -->
          <div v-if="showAddLeaveForm" class="add-leave-form">
            <div class="add-leave-title">添加新假期</div>
            <div class="add-leave-row">
              <span class="add-leave-label">类型</span>
              <el-select v-model="newLeave.type" size="small" style="width:100px;" :disabled="availableLeaveTypes.length === 0">
                <el-option v-for="t in availableLeaveTypes" :key="t.value" :label="t.icon + ' ' + t.label" :value="t.value" />
              </el-select>
              <el-input v-if="newLeave.type==='custom'" v-model="newLeave.customName" size="small" placeholder="假期名称" style="width:80px;" />
            </div>
            <div v-if="availableLeaveTypes.length === 0" class="add-leave-hint">所有假期类型已添加</div>
            <div class="add-leave-row">
              <span class="add-leave-label">天数</span>
              <el-input-number v-model="newLeave.total" :min="1" :max="99" size="small" controls-position="right" style="width:80px;" />
              <span class="add-leave-sep">天</span>
            </div>
            <div class="add-leave-actions">
              <el-button size="small" @click="cancelAddLeave">取消</el-button>
              <el-button type="primary" size="small" @click="confirmAddLeave" :disabled="!canAddLeave">添加</el-button>
            </div>
          </div>
          
          <div class="leave-grid">
            <!-- 年假卡片（不可删除） -->
            <div id="leave-annual" class="leave-card" :class="{ empty: config.leaveAnnual.total - config.leaveAnnual.used === 0, editing: editingLeave === 'annual' }">
              <div class="leave-card-header">
                <span class="leave-card-icon">🏖️</span>
                <span class="leave-card-name">年假</span>
                <el-icon v-if="editingLeave !== 'annual'" class="action-icon" @click="startEditLeave('annual')"><Edit /></el-icon>
                <el-icon v-else class="action-icon success" @click="finishEditLeave"><Check /></el-icon>
              </div>
              <div v-if="editingLeave !== 'annual'" class="leave-card-body">
                <span class="leave-card-num">{{ config.leaveAnnual.total - config.leaveAnnual.used }}</span>
                <span class="leave-card-unit">/{{ config.leaveAnnual.total }}天</span>
              </div>
              <div v-else class="leave-card-edit">
                <div class="leave-edit-field">
                  <span class="leave-edit-label">总</span>
                  <el-input-number v-model="config.leaveAnnual.total" :min="0" :max="99" size="small" controls-position="right" style="width:55px;" />
                </div>
                <div class="leave-edit-field">
                  <span class="leave-edit-label">已休</span>
                  <el-input-number v-model="config.leaveAnnual.used" :min="0" :max="config.leaveAnnual.total" size="small" controls-position="right" style="width:55px;" />
                </div>
              </div>
            </div>
            
            <!-- 福利假卡片（可删除） -->
            <div id="leave-welfare" class="leave-card" :class="{ empty: config.leaveWelfare.total - config.leaveWelfare.used === 0, editing: editingLeave === 'welfare' }">
              <div class="leave-card-header">
                <span class="leave-card-icon">🎁</span>
                <span class="leave-card-name">福利假</span>
                <div class="leave-card-actions">
                  <el-icon v-if="editingLeave !== 'welfare'" class="action-icon" @click="startEditLeave('welfare')"><Edit /></el-icon>
                  <el-icon v-else class="action-icon success" @click="finishEditLeave"><Check /></el-icon>
                  <el-icon class="action-icon danger" @click="removeLeave('welfare')"><Delete /></el-icon>
                </div>
              </div>
              <div v-if="editingLeave !== 'welfare'" class="leave-card-body">
                <span class="leave-card-num">{{ config.leaveWelfare.total - config.leaveWelfare.used }}</span>
                <span class="leave-card-unit">/{{ config.leaveWelfare.total }}天</span>
              </div>
              <div v-else class="leave-card-edit">
                <div class="leave-edit-field">
                  <span class="leave-edit-label">总</span>
                  <el-input-number v-model="config.leaveWelfare.total" :min="0" :max="99" size="small" controls-position="right" style="width:55px;" />
                </div>
                <div class="leave-edit-field">
                  <span class="leave-edit-label">已休</span>
                  <el-input-number v-model="config.leaveWelfare.used" :min="0" :max="config.leaveWelfare.total" size="small" controls-position="right" style="width:55px;" />
                </div>
              </div>
            </div>
            
            <!-- 调休卡片（可删除） -->
            <div id="leave-compensatory" class="leave-card" :class="{ empty: config.leaveCompensatory.total - config.leaveCompensatory.used === 0, editing: editingLeave === 'compensatory' }">
              <div class="leave-card-header">
                <span class="leave-card-icon">🔄</span>
                <span class="leave-card-name">调休</span>
                <div class="leave-card-actions">
                  <el-icon v-if="editingLeave !== 'compensatory'" class="action-icon" @click="startEditLeave('compensatory')"><Edit /></el-icon>
                  <el-icon v-else class="action-icon success" @click="finishEditLeave"><Check /></el-icon>
                  <el-icon class="action-icon danger" @click="removeLeave('compensatory')"><Delete /></el-icon>
                </div>
              </div>
              <div v-if="editingLeave !== 'compensatory'" class="leave-card-body">
                <span class="leave-card-num">{{ config.leaveCompensatory.total - config.leaveCompensatory.used }}</span>
                <span class="leave-card-unit">/{{ config.leaveCompensatory.total }}天</span>
              </div>
              <div v-else class="leave-card-edit">
                <div class="leave-edit-field">
                  <span class="leave-edit-label">总</span>
                  <el-input-number v-model="config.leaveCompensatory.total" :min="0" :max="99" size="small" controls-position="right" style="width:55px;" />
                </div>
                <div class="leave-edit-field">
                  <span class="leave-edit-label">已休</span>
                  <el-input-number v-model="config.leaveCompensatory.used" :min="0" :max="config.leaveCompensatory.total" size="small" controls-position="right" style="width:55px;" />
                </div>
              </div>
            </div>
            
            <!-- 自定义假期卡片 -->
            <div v-for="(leave, i) in config.customLeaves" :key="i" :id="'leave-custom-'+i" class="leave-card" :class="{ editing: editingLeave === 'custom-'+i, 'flash-border': newLeaveCardId === 'custom-'+i }">
              <div class="leave-card-header">
                <span class="leave-card-icon">{{ getLeaveIcon(leave.type) }}</span>
                <span class="leave-card-name">{{ getLeaveName(leave) }}</span>
                <div class="leave-card-actions">
                  <el-icon v-if="editingLeave !== 'custom-'+i" class="action-icon" @click="startEditLeave('custom-'+i)"><Edit /></el-icon>
                  <el-icon v-else class="action-icon success" @click="finishEditLeave"><Check /></el-icon>
                  <el-icon class="action-icon danger" @click="config.customLeaves.splice(i,1);saveLeaveBalance()"><Delete /></el-icon>
                </div>
              </div>
              <div v-if="editingLeave !== 'custom-'+i" class="leave-card-body">
                <span class="leave-card-num">{{ leave.total - (leave.used||0) }}</span>
                <span class="leave-card-unit">/{{ leave.total }}天</span>
              </div>
              <div v-else class="leave-card-edit">
                <div class="leave-edit-field">
                  <el-select v-model="leave.type" size="small" style="width:60px;" @change="finishEditLeave">
                    <el-option label="育儿假" value="parental" /><el-option label="婚假" value="marriage" />
                    <el-option label="丧假" value="bereavement" /><el-option label="产假" value="maternity" />
                    <el-option label="陪产假" value="paternity" /><el-option label="病假" value="sick" />
                    <el-option label="自定义" value="custom" />
                  </el-select>
                  <el-input v-if="leave.type==='custom'" v-model="leave.customName" size="small" placeholder="名称" style="width:50px;" />
                </div>
                <div class="leave-edit-field">
                  <span class="leave-edit-label">总</span>
                  <el-input-number v-model="leave.total" :min="0" :max="99" size="small" controls-position="right" style="width:55px;" />
                </div>
                <div class="leave-edit-field">
                  <span class="leave-edit-label">已休</span>
                  <el-input-number v-model="leave.used" :min="0" :max="leave.total" size="small" controls-position="right" style="width:55px;" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 纪念日 -->
        <div v-show="activeTab === 'anniversary'" class="tab-panel">
          <div v-if="anniversaries.length === 0 && !showForm" class="es"><div class="ei">💝</div><div class="et">还没有纪念日</div><el-button type="primary" size="small" @click="showForm = true">添加纪念日</el-button></div>
          
          <div v-for="ann in anniversaries" :key="ann.name + ann.date" class="countdown-card" :class="{ starred: ann.starred, 'is-today': ann.isToday }">
            <div class="ch">
              <div class="card-label">{{ ann.icon || '📅' }} {{ ann.name }}<span v-if="ann.years > 0" class="ay">({{ ann.years }}周年)</span></div>
              <div class="ca">
                <el-tooltip :content="ann.starred ? '取消星标' : '星标'" placement="top">
                  <el-icon class="action-icon" :class="{ starred: ann.starred }" @click="toggleStar(ann)"><StarFilled v-if="ann.starred" /><Star v-else /></el-icon>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-icon class="action-icon danger" @click="removeAnniversary(ann)"><Delete /></el-icon>
                </el-tooltip>
              </div>
            </div>
            <div class="ad">{{ ann.dateStr }}</div>
            <div v-if="ann.isToday" class="cb">{{ ann.blessing }}</div>
            <div v-else class="card-timer"><span class="tb">{{ ann.days }}</span><span class="tu">天</span><span class="tb">{{ pad(ann.hours) }}</span><span class="ts">:</span><span class="tb">{{ pad(ann.minutes) }}</span><span class="ts">:</span><span class="tb">{{ pad(ann.seconds) }}</span></div>
          </div>
          
          <!-- 添加表单 -->
          <div v-if="showForm" class="af">
            <div class="ft">添加纪念日</div>
            
            <!-- 风格选择 -->
            <div class="fr">
              <span class="fl">风格</span>
              <el-radio-group v-model="formStyle" size="small">
                <el-radio-button value="normal">常规</el-radio-button>
                <el-radio-button value="cute">亲昵</el-radio-button>
                <el-radio-button value="imperial">宫廷</el-radio-button>
                <el-radio-button value="cultivation">修仙</el-radio-button>
              </el-radio-group>
            </div>
            
            <!-- 预设选择 -->
            <div class="fr">
              <span class="fl">预设</span>
              <el-select v-model="selectedPreset" size="small" placeholder="选择预设" @change="applyPreset" clearable style="width: 100%;">
                <el-option-group label="长辈">
                  <el-option value="father" :label="presetLabels.father">
                    <el-tooltip content="父亲" placement="left"><span>{{ presetLabels.father }}</span></el-tooltip>
                  </el-option>
                  <el-option value="mother" :label="presetLabels.mother">
                    <el-tooltip content="母亲" placement="left"><span>{{ presetLabels.mother }}</span></el-tooltip>
                  </el-option>
                </el-option-group>
                <el-option-group label="爱人">
                  <el-option value="lover" :label="presetLabels.lover">
                    <el-tooltip content="爱人" placement="left"><span>{{ presetLabels.lover }}</span></el-tooltip>
                  </el-option>
                </el-option-group>
                <el-option-group label="晚辈">
                  <el-option value="son" :label="presetLabels.son">
                    <el-tooltip content="儿子" placement="left"><span>{{ presetLabels.son }}</span></el-tooltip>
                  </el-option>
                  <el-option value="daughter" :label="presetLabels.daughter">
                    <el-tooltip content="女儿" placement="left"><span>{{ presetLabels.daughter }}</span></el-tooltip>
                  </el-option>
                </el-option-group>
                <el-option-group label="自己">
                  <el-option value="myself" :label="presetLabels.myself">
                    <el-tooltip content="自己" placement="left"><span>{{ presetLabels.myself }}</span></el-tooltip>
                  </el-option>
                </el-option-group>
                <el-option-group label="其他">
                  <el-option value="wedding" :label="presetLabels.wedding">
                    <el-tooltip content="夫妻" placement="left"><span>{{ presetLabels.wedding }}</span></el-tooltip>
                  </el-option>
                  <el-option value="work" :label="presetLabels.work">
                    <el-tooltip content="自己" placement="left"><span>{{ presetLabels.work }}</span></el-tooltip>
                  </el-option>
                  <el-option label="📝 自定义" value="custom" />
                </el-option-group>
              </el-select>
            </div>
            
            <div class="fr">
              <span class="fl">名称</span>
              <el-input v-model="newAnn.name" size="small" placeholder="如：爸爸的生日" />
            </div>
            <div class="fr">
              <span class="fl">日期</span>
              <el-date-picker v-model="newAnn.date" type="date" size="small" value-format="YYYY-MM-DD" format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%;" popper-class="date-picker-popper" />
            </div>
            <div class="fr">
              <span class="fl">重复</span>
              <el-radio-group v-model="newAnn.repeat" size="small">
                <el-radio-button value="yearly">每年</el-radio-button>
                <el-radio-button value="monthly">每月</el-radio-button>
                <el-radio-button value="none">不重复</el-radio-button>
              </el-radio-group>
            </div>
            <div class="fr">
              <el-checkbox v-model="newAnn.starred" size="small">显示在首页</el-checkbox>
            </div>
            <div class="fa">
              <el-button size="small" @click="showForm = false">取消</el-button>
              <el-button type="primary" size="small" @click="addAnniversary">添加</el-button>
            </div>
          </div>
          
          <div v-if="anniversaries.length > 0 && !showForm" class="ab">
            <el-button type="primary" size="small" @click="showForm = true">+ 添加纪念日</el-button>
          </div>
        </div>
        
        <!-- 设置 -->
        <div v-show="activeTab === 'settings'" class="tab-panel st">
          <div class="ss" ref="settingsScroll" @scroll="onSettingsScroll">
            <SettingsPanel ref="settingsPanel" @updateConfig="handleConfigUpdate" />
          </div>
          <div class="scroll-indicator-wrapper" @mouseenter="onDividerHover" @mouseleave="hideScrollHintDelayed">
            <div v-if="showScrollArrow && scrollDirection === 'up'" class="scroll-hint scroll-hint-up">
              <el-icon class="scroll-arrow arrow-sm"><ArrowUpBold /></el-icon>
              <el-icon class="scroll-arrow arrow-md"><ArrowUpBold /></el-icon>
              <el-icon class="scroll-arrow arrow-lg"><ArrowUpBold /></el-icon>
            </div>
            <div class="scroll-divider"></div>
            <div v-if="showScrollArrow && scrollDirection === 'down'" class="scroll-hint scroll-hint-down">
              <el-icon class="scroll-arrow arrow-lg"><ArrowDownBold /></el-icon>
              <el-icon class="scroll-arrow arrow-md"><ArrowDownBold /></el-icon>
              <el-icon class="scroll-arrow arrow-sm"><ArrowDownBold /></el-icon>
            </div>
          </div>
          <div class="sf"><el-button size="small" @click="handleReset">恢复默认</el-button><el-button type="primary" size="small" @click="handleSave" :loading="saving">保存</el-button></div>
        </div>
      </div>
      
      <div class="fq">{{ chickenSoup }}</div>
    </div>
    
    <!-- 日历视图 -->
    <div v-show="currentView === 'calendar'" class="cv"><LunarCalendar detail @select="handleDateSelect" /></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Check, Plus, Star, StarFilled, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue'
import SettingsPanel from './components/SettingsPanel.vue'
import VacationPlanner from './components/VacationPlanner.vue'
import LunarCalendar from './components/LunarCalendar.vue'

const pad = (n) => String(n).padStart(2, '0')

const tabs = [
  { key: 'home', name: '首页', icon: '🏠' },
  { key: 'holiday', name: '假期', icon: '🎉' },
  { key: 'anniversary', name: '纪念日', icon: '💝' },
  { key: 'settings', name: '设置', icon: '⚙️' }
]

const activeTab = ref('home')
const currentView = ref('main')
const saving = ref(false)
const settingsPanel = ref(null)
const showForm = ref(false)
const editingLeave = ref(null)
const showAddLeaveForm = ref(false)
const newLeave = reactive({ type: 'custom', customName: '', total: 1 })
const newLeaveCardId = ref(null)

// 设置页面滚动相关
const settingsScroll = ref(null)
const canScrollUp = ref(false)
const canScrollDown = ref(false)
const scrollDirection = ref('none') // 'up' | 'down' | 'none'
const showScrollArrow = ref(false)
let scrollHintTimer = null
let scrollHintDismissTimer = null
let lastScrollTop = 0
const selectedPreset = ref('')
const formStyle = ref('normal')

const newAnn = reactive({ name: '', date: '', repeat: 'yearly', starred: true, icon: '', person: '' })

// 预设配置 - 常规风格
const presetsNormal = {
  myself: { name: '我的生日', icon: '🎂', person: 'self' },
  father: { name: '父亲的生日', icon: '👨', person: 'male_elder' },
  mother: { name: '母亲的生日', icon: '👩', person: 'female_elder' },
  lover: { name: '爱人的生日', icon: '💕', person: 'lover' },
  son: { name: '儿子的生日', icon: '👦', person: 'male_young' },
  daughter: { name: '女儿的生日', icon: '👧', person: 'female_young' },
  wedding: { name: '结婚纪念日', icon: '💒', person: 'couple' },
  work: { name: '入职纪念日', icon: '🎉', person: 'self' }
}

// 预设配置 - 亲昵风格
const presetsCute = {
  myself: { name: '我的破壳日', icon: '🐣', person: 'self' },
  father: { name: '老爸的生日', icon: '🧑', person: 'male_elder' },
  mother: { name: '老妈的生日', icon: '👩', person: 'female_elder' },
  lover: { name: '宝贝的生日', icon: '💖', person: 'lover' },
  son: { name: '臭小子的生日', icon: '🧒', person: 'male_young' },
  daughter: { name: '小棉袄的生日', icon: '🎀', person: 'female_young' },
  wedding: { name: '我们的纪念日', icon: '💑', person: 'couple' },
  work: { name: '搬砖纪念日', icon: '💪', person: 'self' }
}

// 预设配置 - 宫廷风格
const presetsImperial = {
  myself: { name: '朕的诞辰', icon: '👑', person: 'self' },
  father: { name: '父皇的诞辰', icon: '🏯', person: 'male_elder' },
  mother: { name: '母后的诞辰', icon: '👸', person: 'female_elder' },
  lover: { name: '爱妃的诞辰', icon: '👑', person: 'lover' },
  son: { name: '皇儿的诞辰', icon: '🤴', person: 'male_young' },
  daughter: { name: '公主的诞辰', icon: '👸', person: 'female_young' },
  wedding: { name: '大婚之喜', icon: '🏯', person: 'couple' },
  work: { name: '登基纪念日', icon: '👑', person: 'self' }
}

// 预设配置 - 修仙风格
const presetsCultivation = {
  myself: { name: '本座的诞辰', icon: '⚡', person: 'self' },
  father: { name: '老祖的寿辰', icon: '🏔️', person: 'male_elder' },
  mother: { name: '圣母的寿辰', icon: '🌸', person: 'female_elder' },
  lover: { name: '道侣的诞辰', icon: '💫', person: 'lover' },
  son: { name: '少主的诞辰', icon: '⚔️', person: 'male_young' },
  daughter: { name: '小仙子的诞辰', icon: '✨', person: 'female_young' },
  wedding: { name: '结缘大典', icon: '🔮', person: 'couple' },
  work: { name: '入道纪念日', icon: '📖', person: 'self' }
}

// 人物关系描述（用于 tooltip 提示）
const personDesc = {
  myself: '自己',
  father: '父亲',
  mother: '母亲',
  lover: '爱人',
  son: '儿子',
  daughter: '女儿',
  wedding: '夫妻',
  work: '自己'
}

// 根据风格获取预设标签
const presetLabels = computed(() => {
  const styleMap = { normal: presetsNormal, cute: presetsCute, imperial: presetsImperial, cultivation: presetsCultivation }
  const p = styleMap[formStyle.value] || presetsNormal
  return {
    myself: `${p.myself.icon} ${p.myself.name}`,
    father: `${p.father.icon} ${p.father.name}`,
    mother: `${p.mother.icon} ${p.mother.name}`,
    lover: `${p.lover.icon} ${p.lover.name}`,
    son: `${p.son.icon} ${p.son.name}`,
    daughter: `${p.daughter.icon} ${p.daughter.name}`,
    wedding: `${p.wedding.icon} ${p.wedding.name}`,
    work: `${p.work.icon} ${p.work.name}`
  }
})

// 应用预设
const applyPreset = (val) => {
  if (!val || val === 'custom') {
    newAnn.name = ''
    newAnn.icon = '📅'
    newAnn.person = ''
    return
  }
  const styleMap = { normal: presetsNormal, cute: presetsCute, imperial: presetsImperial, cultivation: presetsCultivation }
  const p = styleMap[formStyle.value] || presetsNormal
  if (p[val]) {
    newAnn.name = p[val].name
    newAnn.icon = p[val].icon
    newAnn.person = p[val].person
  }
}

const toggleCalendar = () => { currentView.value = currentView.value === 'main' ? 'calendar' : 'main' }
const handleDateSelect = (day) => {}

const addAnniversary = () => {
  if (!newAnn.name || !newAnn.date) { ElMessage.warning('请填写名称和日期'); return }
  config.anniversaries.push({ ...newAnn, style: formStyle.value })
  newAnn.name = ''; newAnn.date = ''; newAnn.repeat = 'yearly'; newAnn.starred = true; newAnn.icon = ''; newAnn.person = ''
  selectedPreset.value = ''; showForm.value = false
  saveConfig(); updateAnniversaries(); ElMessage.success('添加成功')
}

const toggleStar = (ann) => {
  const item = config.anniversaries.find(a => a.name === ann.name && a.date === ann.date)
  if (item) { item.starred = !item.starred; saveConfig(); updateAnniversaries() }
}

const removeAnniversary = (ann) => {
  ElMessageBox.confirm('确定删除该纪念日？', '提示', { type: 'warning' }).then(() => {
    const idx = config.anniversaries.findIndex(a => a.name === ann.name && a.date === ann.date)
    if (idx > -1) { config.anniversaries.splice(idx, 1); saveConfig(); updateAnniversaries(); ElMessage.success('已删除') }
  }).catch(() => {})
}

const saveConfig = () => {
  localStorage.setItem('goHomeConfig', JSON.stringify(config));
  try { chrome.storage.local.set({ config: { workType:config.workType, customWorkDays:config.customWorkDays, onWorkTime:config.onWorkTime, offWorkTime:config.offWorkTime, payOffDay:config.payOffDay, lunchReminderTime:config.lunchReminderTime, lunchReminderEnabled:config.lunchReminderEnabled, dinnerReminderTime:config.dinnerReminderTime, dinnerReminderEnabled:config.dinnerReminderEnabled, notificationsEnabled:config.notificationsEnabled } }); } catch(e) {}
}
const handleSave = () => { settingsPanel.value?.save() }
const handleReset = () => { settingsPanel.value?.handleReset().then(() => saveConfig()) }
const handleConfigUpdate = () => { loadConfig(); saveConfig(); syncToBackground(); ElMessage.success('设置已保存') }

// 假期类型映射
const leaveTypeMap = {
  parental: { name: '育儿假', icon: '👶' },
  marriage: { name: '婚假', icon: '💒' },
  bereavement: { name: '丧假', icon: '🕯️' },
  maternity: { name: '产假', icon: '🤰' },
  paternity: { name: '陪产假', icon: '👨‍🍼' },
  sick: { name: '病假', icon: '🤒' },
  custom: { name: '自定义', icon: '📅' }
}

// 所有假期类型选项
const allLeaveTypes = [
  { value: 'annual', label: '年假', icon: '🏖️' },
  { value: 'welfare', label: '福利假', icon: '🎁' },
  { value: 'compensatory', label: '调休', icon: '🔄' },
  { value: 'parental', label: '育儿假', icon: '👶' },
  { value: 'marriage', label: '婚假', icon: '💒' },
  { value: 'bereavement', label: '丧假', icon: '🕯️' },
  { value: 'maternity', label: '产假', icon: '🤰' },
  { value: 'paternity', label: '陪产假', icon: '👨‍🍼' },
  { value: 'sick', label: '病假', icon: '🤒' },
  { value: 'custom', label: '自定义', icon: '📅' }
]

// 获取已存在的假期类型
const existingLeaveTypes = computed(() => {
  const types = []
  // 标准假期
  if (config.leaveAnnual.total > 0) types.push('annual')
  if (config.leaveWelfare.total > 0) types.push('welfare')
  if (config.leaveCompensatory.total > 0) types.push('compensatory')
  // 自定义假期
  config.customLeaves.forEach(l => {
    if (l.type && l.type !== 'custom') types.push(l.type)
  })
  return types
})

// 可用的假期类型选项（排除已存在的）
const availableLeaveTypes = computed(() => {
  return allLeaveTypes.filter(t => !existingLeaveTypes.value.includes(t.value))
})

// 判断是否可以添加假期
const canAddLeave = computed(() => {
  if (!newLeave.type) return false
  if (newLeave.type === 'custom' && !newLeave.customName) return false
  if (newLeave.total < 1) return false
  return true
})

const getLeaveIcon = (type) => leaveTypeMap[type]?.icon || '📅'
const getLeaveName = (leave) => {
  if (leave.type === 'custom') return leave.customName || '自定义'
  return leaveTypeMap[leave.type]?.name || '未知'
}

// 开始编辑假期
const startEditLeave = (key) => {
  editingLeave.value = key
}

// 完成编辑假期
const finishEditLeave = () => {
  editingLeave.value = null
  saveLeaveBalance()
}

// 取消添加假期
const cancelAddLeave = () => {
  showAddLeaveForm.value = false
  newLeave.type = 'custom'
  newLeave.customName = ''
  newLeave.total = 1
}

// 确认添加假期
const confirmAddLeave = () => {
  if (!canAddLeave.value) return
  
  // 根据类型添加到对应位置
  if (newLeave.type === 'annual') {
    config.leaveAnnual.total = newLeave.total
    config.leaveAnnual.used = 0
  } else if (newLeave.type === 'welfare') {
    config.leaveWelfare.total = newLeave.total
    config.leaveWelfare.used = 0
  } else if (newLeave.type === 'compensatory') {
    config.leaveCompensatory.total = newLeave.total
    config.leaveCompensatory.used = 0
  } else {
    // 自定义假期添加到列表末尾
    const leave = {
      type: newLeave.type,
      customName: newLeave.type === 'custom' ? newLeave.customName : '',
      total: newLeave.total,
      used: 0
    }
    config.customLeaves.push(leave)
    newLeaveCardId.value = 'custom-' + (config.customLeaves.length - 1)
  }
  
  // 保存配置
  saveLeaveBalance()
  
  // 重置表单
  cancelAddLeave()
  
  // 滚动到新卡片并闪烁
  nextTick(() => {
    scrollToNewCard()
  })
}

// 滚动到新卡片
const scrollToNewCard = () => {
  const cardId = newLeaveCardId.value
  if (!cardId) return
  
  // 延迟一下确保 DOM 已更新
  setTimeout(() => {
    const cardEl = document.getElementById('leave-' + cardId)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 添加闪烁动画
      cardEl.classList.add('flash-border')
      setTimeout(() => {
        cardEl.classList.remove('flash-border')
        newLeaveCardId.value = null
      }, 1500)
    }
  }, 100)
}

// 删除假期（福利假/调休重置为0，自定义假期直接删除）
const removeLeave = (type) => {
  if (type === 'welfare') {
    config.leaveWelfare = { total: 0, used: 0 }
  } else if (type === 'compensatory') {
    config.leaveCompensatory = { total: 0, used: 0 }
  }
  saveLeaveBalance()
}

const saveLeaveBalance = () => {
  editingLeave.value = null
  saveConfig()
  syncToBackground()
  updateLeaveBalance()
  ElMessage.success('假期余额已保存')
}

// 滚动处理
const onSettingsScroll = () => {
  if (!settingsScroll.value) return
  const el = settingsScroll.value
  const currentScrollTop = el.scrollTop
  
  canScrollUp.value = currentScrollTop > 0
  canScrollDown.value = currentScrollTop < el.scrollHeight - el.clientHeight - 1
  
  // 判断滚动方向
  if (currentScrollTop > lastScrollTop) {
    // 向下滚动
    scrollDirection.value = canScrollDown.value ? 'down' : 'up'
  } else if (currentScrollTop < lastScrollTop) {
    // 向上滚动
    scrollDirection.value = canScrollUp.value ? 'up' : 'down'
  }
  lastScrollTop = currentScrollTop
  
  // 显示箭头
  showScrollArrow.value = true
  
  // 清除之前的定时器
  if (scrollHintTimer) clearTimeout(scrollHintTimer)
  if (scrollHintDismissTimer) clearTimeout(scrollHintDismissTimer)
  
  // 5秒后隐藏箭头
  scrollHintTimer = setTimeout(() => {
    if (!showScrollHint.value) {
      showScrollArrow.value = false
      scrollDirection.value = 'none'
    }
  }, 5000)
}

// 鼠标悬停分割线时显示箭头
const onDividerHover = () => {
  showScrollHint.value = true
  if (!settingsScroll.value) return
  const el = settingsScroll.value
  canScrollUp.value = el.scrollTop > 0
  canScrollDown.value = el.scrollTop < el.scrollHeight - el.clientHeight - 1
  
  // 默认显示可滚动的方向
  if (canScrollDown.value) {
    scrollDirection.value = 'down'
  } else if (canScrollUp.value) {
    scrollDirection.value = 'up'
  }
  showScrollArrow.value = true
}

// 延迟隐藏滚动提示
const hideScrollHintDelayed = () => {
  showScrollHint.value = false
  scrollHintDismissTimer = setTimeout(() => {
    showScrollArrow.value = false
    scrollDirection.value = 'none'
  }, 300)
}

// 检查滚动状态
const checkScrollStatus = () => {
  if (!settingsScroll.value) return
  const el = settingsScroll.value
  canScrollUp.value = el.scrollTop > 0
  canScrollDown.value = el.scrollTop < el.scrollHeight - el.clientHeight - 1
  lastScrollTop = el.scrollTop
}

const getRandomSoup = () => {
  const s = ['小心点，你老板在你背后', '工作再累，也别忘了摸鱼哦', '我毕生的梦想，就是可以准点下班', '你上会班吧，我替你老板求求你了', '别划水了，上岸换口气吧', '愿你的烦恼，像你的头发一样，越来越少']
  return s[Math.floor(Math.random() * s.length)]
}

const chickenSoup = ref(getRandomSoup())
const onWork = reactive({ hours: 0, minutes: 0, seconds: 0 })
const offWork = reactive({ hours: 0, minutes: 0, seconds: 0 })
const weekend = ref(null); const showWeekend = ref(true)
const holidayList = ref([])
const payOff = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const isPayDay = ref(false); const payDayMessage = ref(''); let targetPayDay = null
const leaveBalance = ref([]); const starredAnniversaries = ref([]); const anniversaries = ref([])
const config = reactive({ workType:'standard', customWorkDays:['1','2','3','4','5'], onWorkTime:'09:00', offWorkTime:'18:00', payOffDay:10, payOffAdjust:'none', lunchReminderTime:'11:00', lunchReminderEnabled:true, dinnerReminderTime:'17:00', dinnerReminderEnabled:false, notificationsEnabled:true, onWorkNotifyEnabled:true, offWorkNotifyEnabled:true, leaveAnnual:{total:5,used:0}, leaveWelfare:{total:0,used:0}, leaveCompensatory:{total:0,used:0}, customLeaves:[], anniversaries:[] })
const dateTime = ref(''); const workStatus = ref(0); const isWorkDay = ref(true); const isMakeupWorkday = ref(false)
let timer = null; const holidayData = ref(null); let holidayRawData = null
const nextHoliday = computed(() => holidayList.value.length > 0 ? holidayList.value[0] : null)

const HOLIDAY_CACHE_KEY_PREFIX = 'holiday_cn_'; const HOLIDAY_FETCH_FLAG_KEY = 'holiday_cn_fetch_flag'
const HOLIDAY_SOURCES = [ y=>`https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${y}.json`, y=>`https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${y}.json`, y=>`https://fastly.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${y}.json` ]

const fetchFromSource = async (url, timeout = 5000) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout); try { const r = await fetch(url, { signal: c.signal }); clearTimeout(t); if (!r.ok) throw new Error(); return await r.json() } catch (e) { clearTimeout(t); throw e } }
const fetchHolidayData = async (year) => { for (const g of HOLIDAY_SOURCES) { try { const d = await fetchFromSource(g(year)); if (d?.year && Array.isArray(d.days)) return d } catch (e) {} } return null }
const getHolidayDataByYear = async (year) => { const k = `${HOLIDAY_CACHE_KEY_PREFIX}${year}`; try { const c = localStorage.getItem(k); if (c) { const p = JSON.parse(c); if (p?.year === year && p.days?.length > 0) return p; localStorage.removeItem(k) } } catch (e) { localStorage.removeItem(k) } const d = await fetchHolidayData(year); if (d) try { localStorage.setItem(k, JSON.stringify(d)) } catch (e) {} return d }
const getAllHolidayData = async () => { const y = new Date().getFullYear(); const cur = await getHolidayDataByYear(y); let nxt = null; if (new Date().getMonth() >= 10) { try { const c = localStorage.getItem(`${HOLIDAY_CACHE_KEY_PREFIX}${y+1}`); if (c) { const p = JSON.parse(c); if (p?.year === y+1 && p.days?.length > 0) nxt = p } } catch (e) {} if (!nxt) { try { const f = localStorage.getItem(HOLIDAY_FETCH_FLAG_KEY); if (!f || JSON.parse(f).date !== new Date().toISOString().split('T')[0]) { nxt = await getHolidayDataByYear(y+1); localStorage.setItem(HOLIDAY_FETCH_FLAG_KEY, JSON.stringify({date:new Date().toISOString().split('T')[0]})) } } catch (e) {} } } return { year:y, days:[...(cur?.days||[]),...(nxt?.days||[])] } }
const getLocalDateString = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const parseHolidays = (data) => { if (!data?.days?.length) return []; const t=new Date(); t.setHours(0,0,0,0); const od=data.days.filter(d=>d.isOffDay).sort((a,b)=>new Date(a.date)-new Date(b.date)); const h=[]; let c=null; for (const d of od) { const [y,m,dd]=d.date.split('-').map(Number); const dt=new Date(y,m-1,dd); if(dt<t) continue; if(!c) c={name:d.name,start:dt,end:dt}; else { if((dt-c.end)/86400000<=1&&d.name===c.name) c.end=dt; else { h.push(c); c={name:d.name,start:dt,end:dt} } } if(h.length>=5) break } if(c&&h.length<5) h.push(c); return h.map(h=>{const m=h.start.getMonth()+1,d=h.start.getDate();return{name:h.name,startDate:h.start,dateStr:`${m}月${d}日`,duration:Math.round((h.end-h.start)/86400000)+1}}).filter(h=>h.startDate>=t).slice(0,5) }

const checkIsWorkDay = (data) => { const n=new Date(); const ts=getLocalDateString(n); const d=n.getDay(); isMakeupWorkday.value=false; if(data?.days?.length){const td=data.days.find(x=>x.date===ts);if(td){const w=!td.isOffDay;if(w&&(d===0||d===6))isMakeupWorkday.value=true;return w}} if(config.workType==='alternating'){const s=new Date(n.getFullYear(),0,1);const w=Math.ceil((Math.floor((n-s)/86400000)+s.getDay()+1)/7);return w%2===1?[1,2,3,4,5,6].includes(d):[1,2,3,4,5].includes(d)} return(config.customWorkDays||['1','2','3','4','5']).includes(String(d)) }

const parseTime = (s) => { if(!s) return [0,0]; const p=s.split(':'); return [parseInt(p[0])||0,parseInt(p[1])||0] }
const calcDiff = (d) => d<=0?{hours:0,minutes:0,seconds:0}:{hours:Math.floor(d/3600000),minutes:Math.floor((d%3600000)/60000),seconds:Math.floor((d%60000)/1000)}
const formatDT = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`

const loadConfig = () => { try { const s=localStorage.getItem('goHomeConfig'); const def={workType:'standard',customWorkDays:['1','2','3','4','5'],onWorkTime:'09:00',offWorkTime:'18:00',payOffDay:10,payOffAdjust:'none',lunchReminderTime:'11:00',lunchReminderEnabled:true,dinnerReminderTime:'17:00',dinnerReminderEnabled:false,notificationsEnabled:true,onWorkNotifyEnabled:true,offWorkNotifyEnabled:true,leaveAnnual:{total:5,used:0},leaveWelfare:{total:0,used:0},leaveCompensatory:{total:0,used:0},customLeaves:[],anniversaries:[]}; const p=s?JSON.parse(s):{}; Object.assign(config,{...def,...p,leaveAnnual:{...def.leaveAnnual,...p.leaveAnnual},leaveWelfare:{...def.leaveWelfare,...p.leaveWelfare},leaveCompensatory:{...def.leaveCompensatory,...p.leaveCompensatory},customLeaves:p.customLeaves||[],anniversaries:p.anniversaries||[]}); updateLeaveBalance(); updateAnniversaries() } catch(e){} }

const updateLeaveBalance = () => { const b=[]; const std=[{k:'leaveAnnual',n:'年假',i:'🏖️'},{k:'leaveWelfare',n:'福利假',i:'🎁'},{k:'leaveCompensatory',n:'调休',i:'🔄'}]; std.forEach(({k,n,i})=>{const l=config[k];if(l?.total>0)b.push({name:n,icon:i,total:l.total,used:l.used,remaining:l.total-l.used})}); const ci={parental:'👶',marriage:'💒',bereavement:'🕯️',maternity:'🤰',paternity:'👨‍🍼',sick:'🤒',custom:'📅'}; const cn={parental:'育儿假',marriage:'婚假',bereavement:'丧假',maternity:'产假',paternity:'陪产假',sick:'病假'}; config.customLeaves?.forEach(l=>{if(l.total>0){const n=l.type==='custom'?l.customName:cn[l.type];if(n)b.push({name:n,icon:ci[l.type]||'📅',total:l.total,used:l.used||0,remaining:l.total-(l.used||0)})}}); leaveBalance.value=b }

/**
 * 获取纪念日祝福语
 * 根据人物类型和性别使用不同风格
 */
const getBlessing = (name, years, person, style) => {
  const blessings = {
    // 宫廷风格 - 自己
    self_imperial: [
      `🎂 恭祝圣上诞辰吉乐，万寿无疆！`,
      `🎂 今乃圣上寿辰，愿龙体康泰，天下太平！`,
      `🎂 恭贺陛下华诞，愿吾皇万岁万岁万万岁！`
    ],
    // 宫廷风格 - 长辈男性
    male_elder_imperial: [
      `🎂 恭祝父皇诞辰吉乐，福寿安康！`,
      `🎂 今乃父皇华诞，愿父皇万福金安！`,
      `🎂 恭贺父皇寿辰，愿父皇龙体康健！`
    ],
    // 宫廷风格 - 长辈女性
    female_elder_imperial: [
      `🎂 恭祝母后诞辰吉乐，凤体安康！`,
      `🎂 今乃母后华诞，愿母后千岁千千岁！`,
      `🎂 恭贺母后寿辰，愿母后凤体康泰！`
    ],
    // 宫廷风格 - 爱人
    lover_imperial: [
      `💕 爱妃，今乃汝之诞辰，朕心甚悦！`,
      `💕 恭贺爱妃芳辰，愿与爱妃共白首！`,
      `💕 爱妃诞辰，朕特赐此祝福，愿卿笑颜常开！`
    ],
    // 宫廷风格 - 晚辈男性
    male_young_imperial: [
      `🎂 皇儿诞辰，愿汝文武双全，将来堪当大任！`,
      `🎂 恭贺皇儿生辰，愿皇儿学业有成！`,
      `🎂 今乃皇儿寿辰，望皇儿不负朕望！`
    ],
    // 宫廷风格 - 晚辈女性
    female_young_imperial: [
      `🎂 公主诞辰，愿汝平安喜乐，万事顺遂！`,
      `🎂 恭贺公主芳辰，愿公主永远快乐！`,
      `🎂 今乃公主寿辰，愿公主被世间温柔以待！`
    ],
    // 宫廷风格 - 夫妻
    couple_imperial: [
      `🏯 恭贺大婚${years}载，愿帝后和睦，琴瑟和鸣！`,
      `🏯 大婚${years}载，朕与爱妃白首不离！`,
      `🏯 结缡${years}载，愿帝后情深似海，恩爱如初！`
    ],
    // 修仙风格 - 自己
    self_cultivation: [
      `⚡ 恭贺道友诞辰，愿道友修为精进，早日飞升！`,
      `⚡ 今日乃道友寿辰，愿大道三千，道友皆可行！`,
      `⚡ 道友诞辰吉日，愿天地灵气常伴，仙途坦荡！`
    ],
    // 修仙风格 - 长辈男性
    male_elder_cultivation: [
      `🏔️ 恭贺老祖寿辰，愿老祖万寿无疆，福泽绵延！`,
      `🏔️ 今日乃老祖华诞，愿老祖仙福永享，寿与天齐！`,
      `🏔️ 老祖寿辰，愿老祖道法通天，宗门昌盛！`
    ],
    // 修仙风格 - 长辈女性
    female_elder_cultivation: [
      `🌸 恭贺圣母寿辰，愿圣母青春永驻，仙福永享！`,
      `🌸 今日乃圣母华诞，愿圣母法力无边，庇佑众生！`,
      `🌸 圣母寿辰，愿圣母容颜不老，大道通明！`
    ],
    // 修仙风格 - 爱人
    lover_cultivation: [
      `💫 道侣诞辰，愿与道侣共参大道，同登仙途！`,
      `💫 恭贺道侣寿辰，愿双修有成，永结同心！`,
      `💫 道侣华诞，愿与卿执手千年，共证长生！`
    ],
    // 修仙风格 - 晚辈男性
    male_young_cultivation: [
      `⚔️ 少主诞辰，愿少主天赋异禀，他日必成大器！`,
      `⚔️ 恭贺少主寿辰，愿少主根骨精奇，前途无量！`,
      `⚔️ 少主华诞，愿少主勤修不辍，早日结丹！`
    ],
    // 修仙风格 - 晚辈女性
    female_young_cultivation: [
      `✨ 小仙子诞辰，愿仙子灵根聪慧，仙路无忧！`,
      `✨ 恭贺小仙子寿辰，愿仙子前程似锦，永沐仙光！`,
      `✨ 小仙子华诞，愿仙子笑颜常开，福缘深厚！`
    ],
    // 修仙风格 - 夫妻
    couple_cultivation: [
      `🔮 恭贺结缘${years}载，愿道侣同心，共证大道！`,
      `🔮 结缘${years}年，愿与道侣双修圆满，长生久视！`,
      `🔮 缘定${years}载，愿天地为证，道侣情深，永世不分！`
    ],
    // 长辈 - 男性（敬语）
    male_elder: [
      `🎂 祝您生日快乐，福如东海，寿比南山！`,
      `🎂 愿您健康长寿，幸福安康！`,
      `🎂 祝您生日快乐，万事如意！`
    ],
    // 长辈 - 女性（敬语）
    female_elder: [
      `🎂 祝您生日快乐，永远健康美丽！`,
      `🎂 愿您青春永驻，幸福安康！`,
      `🎂 祝您生日快乐，笑口常开！`
    ],
    // 爱人
    lover: [
      `💕 亲爱的，生日快乐！愿我们的爱情甜蜜如初！`,
      `💕 宝贝，生日快乐！有你真好！`,
      `💕 生日快乐，愿每一天都有我陪你度过！`
    ],
    // 晚辈 - 男性
    male_young: [
      `🎂 祝你生日快乐，健康成长，学业有成！`,
      `🎂 生日快乐，愿你前程似锦！`,
      `🎂 又长大一岁了，加油！`
    ],
    // 晚辈 - 女性
    female_young: [
      `🎂 祝你生日快乐，健康快乐每一天！`,
      `🎂 生日快乐，愿你永远开心美丽！`,
      `🎂 小公主生日快乐，愿你被世界温柔以待！`
    ],
    // 自己
    self: [
      `🎂 祝自己生日快乐！新的一岁，继续加油！`,
      `🎂 又长一岁，愿所有的美好都如期而至！`,
      `🎂 生日快乐，感谢自己又努力了一年！`
    ],
    // 夫妻/情侣
    couple: [
      `💒 祝我们结婚${years}周年快乐！愿爱情甜蜜如初！`,
      `💒 ${years}年的相守，感恩有你！`,
      `💒 执子之手，与子偕老，${years}周年快乐！`
    ],
    // 默认
    default: [
      `✨ 今天是${name}，祝你快乐！`,
      `✨ ${name}快乐！`,
      `✨ 特别的日子，愿你开心每一天！`
    ]
  }
  
  // 宫廷/修仙风格优先查找带后缀的 key
  const suffix = style === 'imperial' ? '_imperial' : style === 'cultivation' ? '_cultivation' : ''
  const key = suffix ? `${person}${suffix}` : person
  const list = blessings[key] || blessings[person] || blessings.default
  return list[Math.floor(Math.random() * list.length)]
}

const calcAnniversary = (dateStr, repeat, name, person, icon, style) => {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  let target = new Date(now.getFullYear(), m - 1, d)
  let years = repeat === 'yearly' ? now.getFullYear() - y : 0
  const isToday = target.getTime() === today.getTime()
  if (target < today) { if (repeat === 'yearly') { target.setFullYear(target.getFullYear() + 1); years = target.getFullYear() - y } else if (repeat === 'monthly') { target = new Date(now.getFullYear(), now.getMonth(), d); if (target < today) target.setMonth(target.getMonth() + 1) } }
  const diff = target - now, days = Math.max(0, Math.floor(diff / 86400000)), rem = diff - days * 86400000
  return { days, hours: Math.floor(rem / 3600000), minutes: Math.floor((rem % 3600000) / 60000), seconds: Math.max(0, Math.floor((rem % 60000) / 1000)), years, dateStr: `${m}月${d}日`, isToday, blessing: isToday ? getBlessing(name, years, person, style) : null, icon: icon || '📅' }
}

// 缓存纪念日列表，避免每秒重建
let _annCache = null; let _annCacheKey = '';
const updateAnniversaries = () => {
  const key = JSON.stringify(config.anniversaries||[]);
  if (key !== _annCacheKey) { _annCacheKey = key; _annCache = null; }
  if (!config.anniversaries?.length) { starredAnniversaries.value=[]; anniversaries.value=[]; return }
  const now = Date.now(); const s=[],n=[];
  for (let i=0;i<config.anniversaries.length;i++) {
    const a=config.anniversaries[i]; if(!a.name||!a.date) continue;
    const c=calcAnniversary(a.date,a.repeat,a.name,a.person,a.icon,a.style);
    const item=_annCache?{..._annCache[i],...c}:{...a,...c};
    if(a.starred)s.push(item); n.push(item);
  }
  _annCache = n;
  const sf=(a,b)=>{if(a.isToday&&!b.isToday)return -1;if(!a.isToday&&b.isToday)return 1;return a.days-b.days};
  s.sort(sf);n.sort(sf);
  starredAnniversaries.value=s;anniversaries.value=n
}

const payDayMsgs = ['发工资啦！加个鸡腿犒劳自己~','工资到账！清空购物车！','发薪日快乐！值得一顿大餐！','工资已到账，今晚吃点好的？','工资入账，可以还花呗了...','距离财务自由又近了一步！','工资到账！先别急着花...算了花吧','今天发工资！我请客！']
const isWorkday = (d,hd) => {const ds=getLocalDateString(d),dow=d.getDay();if(hd?.days?.length){const td=hd.days.find(x=>x.date===ds);if(td)return !td.isOffDay}return dow>=1&&dow<=5}
const getAdjPayDay = (y,m,d,adj,hd) => {let t=new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()));if(adj==='none')return t;for(let i=0;i<7;i++){if(isWorkday(t,hd))return t;t.setDate(t.getDate()+(adj==='before'?-1:1))}return t}

const updatePayOff = () => { const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate()); const pd=getAdjPayDay(n.getFullYear(),n.getMonth(),config.payOffDay,config.payOffAdjust,holidayData.value); if(t.getTime()===pd.getTime()){isPayDay.value=true;payDayMessage.value=payDayMsgs[Math.floor((t-new Date(n.getFullYear(),0,0))/86400000)%payDayMsgs.length];targetPayDay=null;payOff.value={days:0,hours:0,minutes:0,seconds:0};return} isPayDay.value=false;payDayMessage.value=''; let tgt=pd;if(tgt<t)tgt=getAdjPayDay(n.getFullYear(),n.getMonth()+1,config.payOffDay,config.payOffAdjust,holidayData.value); targetPayDay=new Date(tgt.getFullYear(),tgt.getMonth(),tgt.getDate());updatePayOffCD() }
const updatePayOffCD = () => { if(!targetPayDay||isPayDay.value)return; const d=targetPayDay-Date.now(); if(d<=0){payOff.value={days:0,hours:0,minutes:0,seconds:0};updatePayOff();return} const dd=Math.floor(d/86400000),r=d-dd*86400000; payOff.value={days:dd,hours:Math.floor(r/3600000),minutes:Math.floor((r%3600000)/60000),seconds:Math.floor((r%60000)/1000)} }
// 缓存假期原始数据（只在数据变化时重建）
let _holidayParsed = null;
const parseHolidayTargets = () => {
  if(!holidayRawData?.length){_holidayParsed=[];return}
  _holidayParsed = holidayRawData.map(h=>({date:h.startDate.toISOString(),dateStr:h.dateStr,name:h.name,duration:h.duration,startDate:h.startDate}))
}
const updateHolidayCD = () => {
  if(!_holidayParsed?.length){holidayList.value=[];return}
  const n=Date.now(); const arr=[];
  for(let i=0;i<_holidayParsed.length&&arr.length<5;i++){
    const h=_holidayParsed[i]; const d=h.startDate-n; if(d<0)continue;
    const dd=Math.floor(d/86400000),r=d-dd*86400000;
    arr.push({date:h.date,dateStr:h.dateStr,name:h.name,duration:h.duration,days:dd,hours:Math.floor(r/3600000),minutes:Math.floor((r%3600000)/60000),seconds:Math.floor((r%60000)/1000)})
  }
  holidayList.value=arr
}

// 缓存上下班时间戳
let _onTs = 0, _offTs = 0, _onStr = '', _offStr = '';
const updateWorkStatus = () => { const n=Date.now(),d=new Date(n),[onH,onM]=parseTime(config.onWorkTime),[offH,offM]=parseTime(config.offWorkTime),h=d.getHours(),m=d.getMinutes();
  if(config.onWorkTime!==_onStr||config.offWorkTime!==_offStr){_onStr=config.onWorkTime;_offStr=config.offWorkTime;
    const t1=new Date(d);t1.setHours(onH,onM,0,0);_onTs=t1.getTime();
    const t2=new Date(d);t2.setHours(offH,offM,0,0);_offTs=t2.getTime();
  }
  if(h<onH||(h===onH&&m<onM)){workStatus.value=0;let t=_onTs;if(t<=n)t+=86400000;Object.assign(onWork,calcDiff(t-n))}
  else if(h>offH||(h===offH&&m>=offM))workStatus.value=2;
  else{workStatus.value=1;Object.assign(offWork,calcDiff(_offTs-n))}
  dateTime.value=formatDT(d)
}
// 缓存周末目标时间
let _weekendTarget = null; let _weekendTargetDay = -1;
// 检查指定日期是否为补班日（在假期数据中标记为非假期的周末）
const isMakeupDay = (date) => {
  if(!holidayData.value?.days?.length) return false;
  const ds = getLocalDateString(date);
  const d = holidayData.value.days.find(x=>x.date===ds);
  // 在假期数据中且不是假期（isOffDay=false），且是周末 → 补班日
  if(d && !d.isOffDay && (date.getDay()===0 || date.getDay()===6)) return true;
  return false;
}

const calcWeekendTarget = () => {
  const dow=new Date().getDay();
  if((dow===0||dow===6)&&!isMakeupWorkday.value){showWeekend.value=false;_weekendTarget=null;_weekendTargetDay=-1;return false}
  showWeekend.value=true;
  if(dow!==_weekendTargetDay){_weekendTargetDay=dow;
    let t=new Date();
    if(dow===6&&isMakeupWorkday.value){t.setDate(t.getDate()+1);t.setHours(0,0,0,0)}
    else{
      let d=6-dow; if(d<=0)d+=7;
      t.setDate(t.getDate()+d); t.setHours(0,0,0,0);
      // 如果目标周六是补班日，则改为周日 00:00:00
      if(isMakeupDay(t)){t.setDate(t.getDate()+1)}
    }
    _weekendTarget=t;
  }
  return true;
}
const updateWeekendDisplay = () => {
  if(!_weekendTarget){weekend.value=null;return}
  const d=_weekendTarget-Date.now(),dd=Math.max(0,Math.floor(d/86400000));
  weekend.value={days:dd,...calcDiff(d-dd*86400000)}
}
// 提醒功能已移至 background.js 处理，App.vue 不再负责提醒
const update = () => { updateWorkStatus();calcWeekendTarget();updateWeekendDisplay();parseHolidayTargets();updateHolidayCD();updatePayOffCD();updateAnniversaries() }

// 节流控制：秒级更新、分秒级更新分离
let _lastSecond = -1; let _lastMinute = -1;
const tick = () => {
  if (document.hidden) { timer=requestAnimationFrame(tick); return }
  const now = new Date(); const sec = now.getSeconds();
  if (sec !== _lastSecond) {
    _lastSecond = sec;
    // 秒级更新：倒计时显示
    updateWorkStatus();
    updatePayOffCD();
    updateAnniversaries();
    updateWeekendDisplay();
    updateHolidayCD();
    // 分钟级更新：目标计算 + 提醒检查
    if (sec === 0) {
      _lastMinute = now.getMinutes();
      calcWeekendTarget();
      parseHolidayTargets();
      if(holidayData.value) isWorkDay.value = checkIsWorkDay(holidayData.value);
      if(now.getHours()===0 && now.getMinutes()===0) updatePayOff();
    }
  }
  timer = requestAnimationFrame(tick);
}

// 同步配置到 background 的函数
const syncToBackground = () => {
  try {
    const cfg = { 
      workType:config.workType, customWorkDays:[...config.customWorkDays], 
      onWorkTime:config.onWorkTime, offWorkTime:config.offWorkTime, 
      payOffDay:config.payOffDay, 
      lunchReminderTime:config.lunchReminderTime, lunchReminderEnabled:config.lunchReminderEnabled, 
      dinnerReminderTime:config.dinnerReminderTime, dinnerReminderEnabled:config.dinnerReminderEnabled, 
      notificationsEnabled:config.notificationsEnabled,
      onWorkNotifyEnabled:config.onWorkNotifyEnabled,
      offWorkNotifyEnabled:config.offWorkNotifyEnabled
    };
    chrome.storage.local.set({ config: cfg });
    chrome.runtime.sendMessage({ action: 'syncConfig', config: cfg });
  } catch(e) {}
}

onMounted(async () => { loadConfig(); saveConfig(); syncToBackground();
  // 延迟检查滚动状态
  nextTick(() => { checkScrollStatus() }); if('Notification' in window&&Notification.permission!=='granted')await Notification.requestPermission(); holidayData.value=await getAllHolidayData(); if(holidayData.value){isWorkDay.value=checkIsWorkDay(holidayData.value);holidayRawData=parseHolidays(holidayData.value);parseHolidayTargets();updateHolidayCD()} updatePayOff();update(); timer=requestAnimationFrame(tick) })
onBeforeUnmount(() => { if(timer)cancelAnimationFrame(timer) })
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
#app{font-family:'Microsoft YaHei',-apple-system,BlinkMacSystemFont,sans-serif;color:#303133;width:640px;height:400px;background:#f5f7fa;display:flex;flex-direction:column;overflow:hidden}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff;border-bottom:1px solid #ebeef5;flex-shrink:0}
.top-left{display:flex;align-items:center;gap:8px}
.top-title{font-size:15px;font-weight:600;color:#303133}
.back-btn{background:none;border:none;font-size:14px;color:#409eff;cursor:pointer;padding:4px}
.top-right{display:flex;align-items:center;gap:8px}
.current-time{font-size:12px;color:#606266;font-family:monospace;cursor:pointer}
.current-time:hover{color:#409eff}
.makeup-tag{font-size:11px;color:#e65100;background:#fff3e0;padding:2px 8px;border-radius:10px;border:1px solid #ffcc80}
.main-view{display:flex;flex-direction:column;flex:1;overflow:hidden}
.tab-nav{display:flex;background:#fff;border-bottom:1px solid #ebeef5;flex-shrink:0}
.tab-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;font-size:11px;color:#909399}
.tab-item:hover{color:#409eff}
.tab-item.active{color:#409eff;border-bottom-color:#409eff}
.tab-icon{font-size:16px}
.tab-content{flex:1;overflow-y:auto;padding:10px;padding-bottom:0}
.tab-panel{display:flex;flex-direction:column;gap:8px}
.sh{font-size:13px;font-weight:600;color:#303133;padding:8px 0 4px}
.eh{font-size:12px;color:#909399;text-align:center;padding:12px}
.countdown-card{background:#fff;border-radius:8px;padding:12px 14px;border:1px solid #ebeef5;position:relative}
.countdown-card.primary{background:linear-gradient(135deg,#ecf5ff,#d9ecff);border-color:#a0cfff}
.countdown-card.warning{background:linear-gradient(135deg,#fdf6ec,#faecd8);border-color:#e6a23c}
.countdown-card.success{background:linear-gradient(135deg,#f0f9eb,#e1f3d8);border-color:#b3e19d;display:flex;align-items:center;gap:6px}
.countdown-card.info{background:linear-gradient(135deg,#ecf5ff,#d9ecff);border-color:#a0cfff;display:flex;align-items:center;gap:6px}
.countdown-card.pay-day{background:linear-gradient(135deg,#fdf6ec,#faecd8);border-color:#e6a23c;display:flex;align-items:center;gap:6px}
.countdown-card.holiday{background:linear-gradient(135deg,#f0f9eb,#e1f3d8);border-color:#b3e19d}
.countdown-card.anniversary{background:linear-gradient(135deg,#fff8e1,#fff3e0);border-color:#ffcc80}
.countdown-card.starred{background:linear-gradient(135deg,#fff8e1,#fff3e0);border-color:#ffcc80}
.countdown-card.is-today{background:linear-gradient(135deg,#fff0f0,#ffe0e0);border-color:#f56c6c}
.ch{display:flex;justify-content:space-between;align-items:flex-start}
.card-label{font-size:12px;color:#909399;display:flex;align-items:center;gap:4px;flex:1}
.card-timer{display:flex;align-items:baseline;gap:2px;margin-top:6px}
.tb{font-size:22px;font-weight:700;color:#303133;font-family:monospace;min-width:32px;text-align:center}
.ts{font-size:18px;font-weight:700;color:#c0c4cc}
.tu{font-size:13px;color:#909399;margin-right:2px}
.ci{font-size:20px;margin-bottom:4px}
.ct{font-size:13px;color:#606266}
.ay{color:#e6a23c;font-size:11px}
.ad{font-size:11px;color:#909399;margin-top:4px}
.cb{font-size:15px;color:#f56c6c;font-weight:500;padding:8px 0;line-height:1.4}
.ca{display:flex;gap:4px;flex-shrink:0}
.ib{background:#f4f4f5;border:1px solid #dcdfe6;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .2s}
.ib:hover{background:#ecf5ff;border-color:#c6e2ff}
.ib.starred{background:#fdf6ec;border-color:#e6a23c}
.ib.danger:hover{background:#fef0f0;border-color:#fbc4c4}
.es{display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:12px}
.ei{font-size:40px}
.et{font-size:13px;color:#909399}
.ab{text-align:center;padding:12px}
.af{background:#fff;border-radius:8px;padding:16px;border:1px solid #ebeef5}
.ft{font-size:14px;font-weight:600;margin-bottom:12px}
.fr{margin-bottom:12px}
.fl{font-size:12px;color:#606266;margin-bottom:4px;display:block}
.fa{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.lg{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.lc{background:#fff;border-radius:8px;padding:12px;border:1px solid #ebeef5;text-align:center}
.lc.empty{opacity:.5}
.lt{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px}
.li{font-size:20px}
.ln{font-size:12px;color:#606266}
.lb{display:flex;align-items:baseline;justify-content:center}
.ln2{font-size:24px;font-weight:700;color:#409eff}
.lt2{font-size:12px;color:#909399;margin-left:2px}
.st{display:flex;flex-direction:column;padding:0;height:100%}
.ss{flex:1;overflow-y:auto;min-height:0}
.sf{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:0 12px 12px 12px;background:#f5f7fa;flex-shrink:0;margin:0}

/* 滚动指示器包装器 */
.scroll-indicator-wrapper {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  height: 8px;
  display: flex;
  align-items: center;
}

/* 分割线 */
.scroll-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #dcdfe6 20%, #dcdfe6 80%, transparent);
}

/* 滚动提示箭头容器 */
.scroll-hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  z-index: 1;
  pointer-events: none;
}

.scroll-hint-up {
  bottom: 100%;
  flex-direction: column;
  align-items: center;
  padding-bottom: 4px;
}

.scroll-hint-down {
  top: 100%;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

/* 箭头基础样式 */
.scroll-arrow {
  color: #909399;
  animation: scrollPulse 1.2s infinite;
}

/* 金字塔样式：小中大 */
.scroll-arrow.arrow-sm {
  font-size: 10px;
  opacity: 0.3;
  animation-delay: 0s;
}

.scroll-arrow.arrow-md {
  font-size: 14px;
  opacity: 0.6;
  animation-delay: 0.15s;
}

.scroll-arrow.arrow-lg {
  font-size: 18px;
  opacity: 1;
  animation-delay: 0.3s;
}

/* 向上箭头动画 */
.scroll-hint-up .scroll-arrow {
  animation-name: scrollArrowUp;
}

/* 向下箭头动画 */
.scroll-hint-down .scroll-arrow {
  animation-name: scrollArrowDown;
}

@keyframes scrollArrowUp {
  0%, 100% { opacity: 0.2; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

@keyframes scrollArrowDown {
  0%, 100% { opacity: 0.2; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(3px); }
}
.fq{padding:8px 14px;text-align:center;font-size:11px;color:#c0c4cc;background:#fff;border-top:1px solid #ebeef5;flex-shrink:0}
.cv{flex:1;overflow-y:auto}

/* 假期标题栏 */
.sh{display:flex;align-items:center;justify-content:space-between}

/* 假期卡片网格 */
.leave-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}

/* 假期卡片 */
.leave-card{background:#fff;border-radius:8px;padding:10px;border:1px solid #ebeef5;transition:all 0.2s}
.leave-card.empty{opacity:0.5}
.leave-card.editing{border-color:#409eff}

/* 卡片头部 - 固定布局 */
.leave-card-header{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.leave-card-icon{font-size:18px;flex-shrink:0}
.leave-card-name{font-size:12px;color:#606266;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.leave-card-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}

/* 卡片内容 - 居中显示 */
.leave-card-body{display:flex;align-items:baseline;justify-content:center;gap:2px}
.leave-card-num{font-size:22px;font-weight:700;color:#409eff}
.leave-card-unit{font-size:12px;color:#909399}

/* 编辑模式 */
.leave-card-edit{display:flex;flex-direction:column;gap:6px}
.leave-edit-field{display:flex;align-items:center;gap:4px;justify-content:center}
.leave-edit-label{font-size:11px;color:#909399;min-width:20px;text-align:right}

/* 添加假期表单 */
.add-leave-form{background:#fff;border-radius:8px;padding:12px;border:1px solid #409eff;margin-bottom:8px}
.add-leave-title{font-size:13px;font-weight:600;color:#303133;margin-bottom:10px}
.add-leave-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.add-leave-label{font-size:12px;color:#606266;min-width:35px}
.add-leave-sep{font-size:12px;color:#909399}
.add-leave-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.add-leave-hint{font-size:11px;color:#909399;text-align:center;padding:4px 0}

/* 功能图标样式 */
.action-icon {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}
.action-icon:hover {
  color: #409eff;
}
.action-icon.success {
  color: #67c23a;
}
.action-icon.success:hover {
  color: #85ce61;
}
.action-icon.danger {
  color: #909399;
}
.action-icon.danger:hover {
  color: #f56c6c;
}
.action-icon.starred {
  color: #e6a23c;
}
.action-icon.starred:hover {
  color: #ebb563;
}

/* 闪烁边框动画 */
@keyframes flashBorder {
  0%, 100% { border-color: #ebeef5; box-shadow: none; }
  25% { border-color: #409eff; box-shadow: 0 0 8px rgba(64, 158, 255, 0.4); }
  50% { border-color: #67c23a; box-shadow: 0 0 8px rgba(103, 194, 58, 0.4); }
  75% { border-color: #409eff; box-shadow: 0 0 8px rgba(64, 158, 255, 0.4); }
}
.flash-border {
  animation: flashBorder 1.5s ease-in-out;
}

/* 修复日期选择器弹出层被 Chrome 扩展弹窗裁剪的问题 */
.date-picker-popper{z-index:9999!important}
.date-picker-popper .el-picker-panel{max-height:340px!important}
.date-picker-popper .el-date-picker__header{padding:4px 12px!important;margin:0!important}
.date-picker-popper .el-picker-panel__body{padding:4px!important}
.date-picker-popper .el-date-table{font-size:12px!important}
.date-picker-popper .el-date-table td{padding:2px!important}
.date-picker-popper .el-date-table th{padding:2px!important;font-size:11px}
</style>
