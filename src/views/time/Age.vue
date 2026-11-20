<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { setTitle } from '../../common.js'

setTitle('年龄计算器')

let birthYear = ref(1999)
let birthMonth = ref(10)
let birthDay = ref(24)

let birthDate = ref(birthYear.value + '-' + birthMonth.value + '-' + birthDay.value)

let age = ref(0)
let ageMonth = ref(0)

function updateBirthDate(newDate) {
  if(!newDate) return;
  const parts = newDate.split('-')
  if (parts.length !== 3) return;

  birthYear.value = parseInt(parts[0])
  birthMonth.value = parseInt(parts[1])
  birthDay.value = parseInt(parts[2])

  // 计算精确的年龄（年和月）
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()
  
  // 计算年龄（年）
  age.value = currentYear - birthYear.value
  
  // 计算月份差
  ageMonth.value = currentMonth - birthMonth.value
  
  // 如果当前日期的天数小于出生日期的天数，减去一个月
  if (currentDay < birthDay.value) {
    ageMonth.value--
  }
  
  // 如果月份差为负数，从年龄减1，并加上12个月
  if (ageMonth.value < 0) {
    age.value--
    ageMonth.value += 12
  }
}

const timeToAge = computed(() => (ageYear) => {
  // 计算当前时间和目标年龄的距离
  const today = new Date();
  const targetYear = birthYear.value + ageYear;
  const targetDate = new Date(targetYear, birthMonth.value - 1, birthDay.value);
  
  // 计算时间差
  const diffTime = targetDate - today;
  const isPast = diffTime < 0;
  
  // 计算年、月、日差距
  let years = 0;
  let months = 0;
  let days = 0;
  
  if (isPast) {
    // 如果目标日期已经过去
    const pastDate = new Date(today - targetDate);
    years = pastDate.getFullYear() - 1970;
    months = pastDate.getMonth();
    days = pastDate.getDate() - 1;
  } else {
    // 如果目标日期还未到来
    const futureDate = new Date(diffTime);
    years = futureDate.getFullYear() - 1970;
    months = futureDate.getMonth();
    days = futureDate.getDate() - 1;
  }
  
  // 格式化输出结果
  if (isPast) {
    return `距离你的${ageYear}岁已经过去了${years}年${months}个月${days}天`;
  } else {
    return `距离你的${ageYear}岁生日，还有${years}年${months}个月${days}天`;
  }
})

watch(birthDate, updateBirthDate)

onMounted(() => {
  updateBirthDate(birthDate.value)
})
</script>

<template>
  <h2 class="tool_title">年龄计算器</h2>
  <div>
    <input type="date" v-model="birthDate" />
  </div>
  <div>
    <p>您的出生日期是 {{ birthYear }} 年 {{ birthMonth }} 月 {{ birthDay }} 日</p>
    <p>您今年 {{ age }} 岁 {{ ageMonth }} 个月</p>
    <p>{{ timeToAge(0) }}</p>
    <p>{{ timeToAge(18) }}</p>
    <p>{{ timeToAge(24) }}</p>
    <p>{{ timeToAge(30) }}</p>
    <p>{{ timeToAge(40) }}</p>
    <p>{{ timeToAge(50) }}</p>
    <p>{{ timeToAge(80) }}</p>
  </div>
</template>
