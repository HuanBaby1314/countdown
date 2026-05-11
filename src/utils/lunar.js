/**
 * 农历转换工具
 */

// 农历数据
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63
]

const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const lunarMonthName = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const lunarDayName = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

// 节气
const solarTerm = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

const sTermInfo = [
  0, 21208, 42467, 63836, 85337, 107014,
  128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494,
  397447, 419210, 440795, 462224, 483532, 504758
]

/**
 * 获取农历某年某月的天数
 */
function lunarMonthDays(year, month) {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

/**
 * 获取农历某年的总天数
 */
function lunarYearDays(year) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(year)
}

/**
 * 获取农历某年闰月的天数
 */
function leapDays(year) {
  if (leapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

/**
 * 获取农历某年闰哪个月
 */
function leapMonth(year) {
  return lunarInfo[year - 1900] & 0xf
}

/**
 * 公历转农历
 */
export function solarToLunar(year, month, day) {
  if (year < 1900 || year > 2100) return ''
  if (year === 1900 && month === 1 && day < 31) return ''

  let offset = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000)

  let lunarYear, daysInYear
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    daysInYear = lunarYearDays(lunarYear)
    offset -= daysInYear
  }
  if (offset < 0) {
    offset += daysInYear
    lunarYear--
  }

  const leap = leapMonth(lunarYear)
  let isLeap = false

  let lunarMonth, daysInMonth
  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
      --lunarMonth
      isLeap = true
      daysInMonth = leapDays(lunarYear)
    } else {
      daysInMonth = lunarMonthDays(lunarYear, lunarMonth)
    }

    if (isLeap && lunarMonth === (leap + 1)) {
      isLeap = false
    }

    offset -= daysInMonth
  }

  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --lunarMonth
    }
  }

  if (offset < 0) {
    offset += daysInMonth
    --lunarMonth
  }

  const lunarDay = offset + 1

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeap,
    monthStr: (isLeap ? '闰' : '') + lunarMonthName[lunarMonth - 1] + '月',
    dayStr: lunarDayName[lunarDay - 1],
    fullStr: (isLeap ? '闰' : '') + lunarMonthName[lunarMonth - 1] + '月' + lunarDayName[lunarDay - 1],
    animal: Animals[(lunarYear - 4) % 12],
    ganZhi: Gan[(lunarYear - 4) % 10] + Zhi[(lunarYear - 4) % 12]
  }
}

/**
 * 获取节气
 */
export function getSolarTerm(year, month, day) {
  for (let i = 0; i < 24; i++) {
    const termDate = new Date((31556925974.7 * (year - 1900) + sTermInfo[i] * 60000) + Date.UTC(1900, 0, 6, 2, 5))
    const termYear = termDate.getUTCFullYear()
    const termMonth = termDate.getUTCMonth() + 1
    const termDay = termDate.getUTCDate()
    
    if (termYear === year && termMonth === month && termDay === day) {
      return solarTerm[i]
    }
  }
  
  return null
}

// ============================================
// 固定公历节日
// ============================================
const fixedHolidays = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-3': '全国爱耳日',
  '3-5': '学雷锋日',
  '3-8': '妇女节',
  '3-12': '植树节',
  '3-14': '白色情人节',
  '3-15': '消费者权益日',
  '3-21': '世界睡眠日',
  '3-22': '世界水日',
  '4-1': '愚人节',
  '4-22': '世界地球日',
  '5-1': '劳动节',
  '5-4': '青年节',
  '5-8': '世界红十字日',
  '5-12': '护士节',
  '5-18': '国际博物馆日',
  '5-20': '表白日',
  '5-31': '世界无烟日',
  '6-1': '儿童节',
  '6-5': '世界环境日',
  '6-6': '全国爱眼日',
  '7-1': '建党节',
  '7-6': '国际接吻日',
  '7-7': '抗日纪念日',
  '7-11': '世界人口日',
  '8-1': '建军节',
  '8-8': '全民健身日',
  '9-3': '抗战胜利日',
  '9-10': '教师节',
  '9-20': '全国爱牙日',
  '9-27': '世界旅游日',
  '10-1': '国庆节',
  '10-4': '世界动物日',
  '10-10': '世界精神卫生日',
  '10-16': '世界粮食日',
  '10-24': '程序员节',
  '10-31': '万圣节',
  '11-1': '万圣节',
  '11-8': '记者节',
  '11-9': '消防宣传日',
  '11-11': '光棍节/双十一',
  '11-17': '国际大学生节',
  '12-1': '世界艾滋病日',
  '12-3': '世界残疾人日',
  '12-13': '国家公祭日',
  '12-20': '澳门回归日',
  '12-24': '平安夜',
  '12-25': '圣诞节'
}

// ============================================
// 固定农历节日
// ============================================
const lunarFixedHolidays = {
  '1-1': '春节',
  '1-2': '初二',
  '1-3': '初三',
  '1-5': '破五',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '2-19': '观音诞',
  '4-4': '文殊菩萨诞',
  '4-8': '佛诞节',
  '5-5': '端午节',
  '6-6': '天贶节',
  '6-19': '观音成道日',
  '6-24': '荷花节',
  '7-7': '七夕',
  '7-15': '中元节',
  '7-22': '财神节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '9-19': '观音出家日',
  '10-1': '寒衣节',
  '10-15': '下元节',
  '12-8': '腊八节',
  '12-23': '小年',
  '12-29': '除夕',  // 可能是29或30，特殊处理
  '12-30': '除夕'
}

// ============================================
// 动态节日（某月第几个星期几）
// ============================================

/**
 * 获取某月第N个星期几的日期
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {number} weekday - 星期几 (0=周日, 1=周一, ... 6=周六)
 * @param {number} n - 第几个 (1=第一个, 2=第二个, ...)
 * @returns {number} 日期 (日)
 */
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = firstDay.getDay()
  
  // 计算第一个目标星期几的日期
  let day = 1 + ((weekday - firstWeekday + 7) % 7)
  
  // 计算第N个
  day += (n - 1) * 7
  
  // 检查是否超出月份
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return 0
  
  return day
}

/**
 * 获取某月倒数第N个星期几的日期
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {number} weekday - 星期几 (0=周日, 1=周一, ... 6=周六)
 * @param {number} n - 倒数第几个 (1=最后一个, 2=倒数第二个, ...)
 * @returns {number} 日期 (日)
 */
function getLastNthWeekdayOfMonth(year, month, weekday, n) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const lastDay = new Date(year, month - 1, daysInMonth)
  const lastWeekday = lastDay.getDay()
  
  // 计算最后一个目标星期几的日期
  let day = daysInMonth - ((lastWeekday - weekday + 7) % 7)
  
  // 计算倒数第N个
  day -= (n - 1) * 7
  
  // 检查是否有效
  if (day < 1) return 0
  
  return day
}

/**
 * 获取动态节日列表（某年）
 * @param {number} year - 年份
 * @returns {Object} { 'M-D': '节日名' }
 */
function getDynamicHolidays(year) {
  const holidays = {}
  
  // 母亲节：5月第二个星期日
  const mothersDay = getNthWeekdayOfMonth(year, 5, 0, 2)
  if (mothersDay) holidays[`5-${mothersDay}`] = '母亲节'
  
  // 父亲节：6月第三个星期日
  const fathersDay = getNthWeekdayOfMonth(year, 6, 0, 3)
  if (fathersDay) holidays[`6-${fathersDay}`] = '父亲节'
  
  // 感恩节：11月第四个星期四
  const thanksgiving = getNthWeekdayOfMonth(year, 11, 4, 4)
  if (thanksgiving) holidays[`11-${thanksgiving}`] = '感恩节'
  
  // 美国劳动节：9月第一个星期一
  const usLaborDay = getNthWeekdayOfMonth(year, 9, 1, 1)
  if (usLaborDay) holidays[`9-${usLaborDay}`] = '美国劳动节'
  
  // 复活节相关（需要复杂计算，这里简化处理）
  // 可以后续添加
  
  // 世界心脏日：9月最后一个星期日
  const worldHeartDay = getLastNthWeekdayOfMonth(year, 9, 0, 1)
  if (worldHeartDay) holidays[`9-${worldHeartDay}`] = '世界心脏日'
  
  // 国际和平日：9月第三个星期二
  const peaceDay = getNthWeekdayOfMonth(year, 9, 2, 3)
  if (peaceDay) holidays[`9-${peaceDay}`] = '国际和平日'
  
  // 世界清洁地球日：9月第三个星期六
  const cleanEarthDay = getNthWeekdayOfMonth(year, 9, 6, 3)
  if (cleanEarthDay) holidays[`9-${cleanEarthDay}`] = '世界清洁地球日'
  
  // 世界旅游日：9月27日（固定）
  
  // 国际聋人日：9月第四个星期日
  const deafDay = getNthWeekdayOfMonth(year, 9, 0, 4)
  if (deafDay) holidays[`9-${deafDay}`] = '国际聋人日'
  
  // 世界标准日：10月14日（固定）
  
  // 世界粮食日：10月16日（固定）
  
  // 国际消除贫困日：10月17日（固定）
  
  // 世界骨质疏松日：10月20日（固定）
  
  // 联合国日：10月24日（固定）
  
  // 世界勤俭日：10月31日（固定）
  
  // 中国记者节：11月8日（固定）
  
  // 世界糖尿病日：11月14日（固定）
  
  // 国际残疾人日：12月3日（固定）
  
  return holidays
}

/**
 * 获取节假日信息
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {number} day - 日期
 * @returns {string|null} 节日名称
 */
export function getHoliday(year, month, day) {
  const key = `${month}-${day}`
  
  // 1. 固定公历节日
  if (fixedHolidays[key]) return fixedHolidays[key]
  
  // 2. 动态节日（某月第几个星期几）
  const dynamicHolidays = getDynamicHolidays(year)
  if (dynamicHolidays[key]) return dynamicHolidays[key]
  
  // 3. 农历节日
  const lunar = solarToLunar(year, month, day)
  if (lunar) {
    const lunarKey = `${lunar.month}-${lunar.day}`
    if (lunarFixedHolidays[lunarKey]) return lunarFixedHolidays[lunarKey]
    
    // 除夕特殊处理
    if (lunar.month === 12) {
      const daysInMonth = lunarMonthDays(lunar.year, 12)
      if (lunar.day === daysInMonth) {
        return '除夕'
      }
    }
  }
  
  // 4. 节气
  const term = getSolarTerm(year, month, day)
  if (term) return term
  
  return null
}

/**
 * 获取日期的完整信息
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {number} day - 日期
 * @returns {Object} { lunar, holiday, displayText }
 */
export function getDateInfo(year, month, day) {
  const lunar = solarToLunar(year, month, day)
  const holiday = getHoliday(year, month, day)
  
  return {
    lunar,
    holiday,
    // 显示优先级：节假日 > 农历初一显示月份 > 农历日
    displayText: holiday || (lunar ? (lunar.day === 1 ? lunar.monthStr : lunar.dayStr) : '')
  }
}
