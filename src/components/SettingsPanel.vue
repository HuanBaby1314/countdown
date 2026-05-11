<template>
  <div class="settings-panel">
    <div class="form-section">
      <div class="section-title">工作时间</div>
      <div class="form-row">
        <span class="form-label">工作制</span>
        <el-select v-model="form.workType" size="small" @change="handleWorkTypeChange" style="width:120px;">
          <el-option label="标准双休" value="standard" />
          <el-option label="大小周" value="alternating" />
          <el-option label="996" value="996" />
          <el-option label="单休" value="single" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </div>
      <div v-if="form.workType === 'custom'" class="form-row">
        <span class="form-label">工作日</span>
        <el-checkbox-group v-model="form.customWorkDays" size="small">
          <el-checkbox label="1">一</el-checkbox>
          <el-checkbox label="2">二</el-checkbox>
          <el-checkbox label="3">三</el-checkbox>
          <el-checkbox label="4">四</el-checkbox>
          <el-checkbox label="5">五</el-checkbox>
          <el-checkbox label="6">六</el-checkbox>
          <el-checkbox label="0">日</el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="form-row">
        <span class="form-label">上班</span>
        <el-time-picker v-model="form.onWorkTime" format="HH:mm" value-format="HH:mm" size="small" style="width:90px;" />
        <el-switch v-model="form.onWorkNotifyEnabled" size="small" style="margin-left:8px;" />
        <span class="form-hint">上班提醒</span>
      </div>
      <div class="form-row">
        <span class="form-label">下班</span>
        <el-time-picker v-model="form.offWorkTime" format="HH:mm" value-format="HH:mm" size="small" style="width:90px;" />
        <el-switch v-model="form.offWorkNotifyEnabled" size="small" style="margin-left:8px;" />
        <span class="form-hint">下班提醒</span>
      </div>
    </div>
    
    <div class="form-section">
      <div class="section-title">发工资</div>
      <div class="form-row">
        <span class="form-label">发薪日</span>
        <el-input-number v-model="form.payOffDay" :min="1" :max="31" size="small" controls-position="right" style="width:70px;" />
        <span class="form-unit">号</span>
        <el-radio-group v-model="form.payOffAdjust" size="small" style="margin-left:10px;">
          <el-radio-button value="none">不调</el-radio-button>
          <el-radio-button value="before">提前</el-radio-button>
          <el-radio-button value="after">延后</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <div class="form-section">
      <div class="section-title">点餐提醒</div>
      <div class="meal-row">
        <span class="meal-label">午餐</span>
        <el-time-picker v-model="form.lunchReminderTime" format="HH:mm" value-format="HH:mm" size="small" style="width:90px;" />
        <el-switch v-model="form.lunchReminderEnabled" size="small" />
      </div>
      <div class="meal-row">
        <span class="meal-label">晚餐</span>
        <el-time-picker v-model="form.dinnerReminderTime" format="HH:mm" value-format="HH:mm" size="small" style="width:90px;" />
        <el-switch v-model="form.dinnerReminderEnabled" size="small" />
      </div>
    </div>
    
    <div class="form-section about-section">
      <el-button type="primary" plain size="small" @click="showAbout = true" style="width:100%;">💝 关于作者</el-button>
    </div>
    
    <!-- 关于作者弹窗 -->
    <el-dialog v-model="showAbout" title="关于作者" width="320px" :show-close="true" center>
      <div class="about-content">
        <div class="about-desc">
          <p>🎉 感谢使用「摸鱼人的倒计时」！</p>
          <p>本插件完全免费，旨在帮助打工人更好地规划工作与休息时间。</p>
          <p>如果你觉得这个插件对你有帮助，欢迎请作者喝杯咖啡 ☕</p>
        </div>
        <div class="qrcode-container">
          <div class="qrcode-item">
            <img src="https://github.com/user-attachments/assets/95175d2a-7887-478b-aa5b-1ff3e9b33b7d" alt="支付宝收款码" class="qrcode-img" />
            <span class="qrcode-label">支付宝</span>
          </div>
          <div class="qrcode-item">
            <img src="https://github.com/user-attachments/assets/10e6c704-7b78-4c2a-acd1-59f76ed99daa" alt="微信收款码" class="qrcode-img" />
            <span class="qrcode-label">微信</span>
          </div>
        </div>
        <div class="about-footer">
          <p>🙏 每一份赞赏都是我持续更新的动力！</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const emit = defineEmits(['updateConfig'])

const showAbout = ref(false)

const defaultForm = {
  workType:'standard', customWorkDays:['1','2','3','4','5'], onWorkTime:'09:00', offWorkTime:'18:00',
  payOffDay:10, payOffAdjust:'none',
  leaveAnnual:{total:5,used:0}, leaveWelfare:{total:0,used:0}, leaveCompensatory:{total:0,used:0},
  customLeaves:[],
  lunchReminderTime:'11:00', lunchReminderEnabled:true, dinnerReminderTime:'17:00', dinnerReminderEnabled:false,
  notificationsEnabled:true,
  onWorkNotifyEnabled:true, offWorkNotifyEnabled:true
}

const form = reactive(JSON.parse(JSON.stringify(defaultForm)))

const loadConfig = () => {
  try {
    const saved = localStorage.getItem('goHomeConfig')
    if (saved) {
      const p = JSON.parse(saved)
      Object.assign(form, { ...defaultForm, ...p, leaveAnnual:{...defaultForm.leaveAnnual,...p.leaveAnnual}, leaveWelfare:{...defaultForm.leaveWelfare,...p.leaveWelfare}, leaveCompensatory:{...defaultForm.leaveCompensatory,...p.leaveCompensatory}, customLeaves:p.customLeaves||[] })
    }
  } catch (e) {}
}

const save = () => {
  localStorage.setItem('goHomeConfig', JSON.stringify(form))
  emit('updateConfig')
}

const handleReset = () => {
  return ElMessageBox.confirm('恢复默认？','提示',{type:'warning'}).then(()=>{
    Object.assign(form, JSON.parse(JSON.stringify(defaultForm)))
    save()
  }).catch(()=>{})
}

const handleWorkTypeChange = (v) => {
  const m={standard:['1','2','3','4','5'],alternating:['1','2','3','4','5','6'],996:['1','2','3','4','5','6'],single:['1','2','3','4','5','6']}
  if(m[v]) form.customWorkDays=m[v]
  if(v==='996'){form.onWorkTime='09:00';form.offWorkTime='21:00'}
}

defineExpose({ save, handleReset })
onMounted(() => loadConfig())
</script>

<style scoped>
.settings-panel { padding: 12px; }

.form-section { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.form-section:last-of-type { border-bottom: none; }

.section-title { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 10px; }

.form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.form-label { width: 50px; font-size: 12px; color: #606266; flex-shrink: 0; }
.form-sep { color: #c0c4cc; }
.form-unit { font-size: 12px; color: #909399; }
.form-hint { font-size: 11px; color: #909399; }

/* 关于作者样式 */
.about-section {
  border-bottom: none;
  padding-top: 4px;
}

.about-content {
  text-align: center;
}

.about-desc {
  margin-bottom: 16px;
}

.about-desc p {
  margin: 8px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin: 20px 0;
}

.qrcode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.qrcode-img {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  object-fit: contain;
  background: #fff;
  transition: transform 0.3s;
}
.qrcode-img:hover {
  transform: scale(1.2);
}

.qrcode-label {
  font-size: 12px;
  color: #909399;
}

.about-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.about-footer p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.leave-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.leave-name { width: 40px; font-size: 12px; color: #606266; flex-shrink: 0; }
.leave-sep { font-size: 11px; color: #909399; }

.meal-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.meal-label { width: 35px; font-size: 12px; color: #606266; flex-shrink: 0; }

.icon-btn { padding: 5px !important; }
.icon-btn.danger { background: #fef0f0 !important; border-color: #fbc4c4 !important; color: #f56c6c !important; }
.icon-btn.danger:hover { background: #f56c6c !important; color: #fff !important; }

:deep(.el-checkbox) { margin-right: 8px; }
:deep(.el-radio-button__inner) { padding: 5px 10px; }
</style>
