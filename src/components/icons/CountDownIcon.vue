<template>
  <svg viewBox="0 0 110 110" width="110" height="110">
    <!-- 倒计时圆环轨道 -->
    <circle
      cx="55"
      cy="55"
      r="53"
      fill="none"
      stroke="var(--color-accent)"
      stroke-width="4"
      :stroke-dasharray="`${TOTAL_PERIMETER}px`"
      :style="{
        transform: 'rotate(-90deg)',
        transformOrigin: 'center center',
        transition: '1s linear',
        strokeDashoffset: `${dashOffset}px`
      }"
    ></circle>
    <!-- 头部运动小圆点 -->
    <circle
      cx="2"
      cy="55"
      r="2"
      fill="var(--color-accent)"
      :style="{
        transformOrigin: '55px 55px',
        transition: '1s linear',
        transform: `rotate(${dotRotation}deg)`
      }"
    ></circle>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    totalTime?: number
    currentTime?: number
    isRunning?: boolean
    // 兼容旧属性名 enableAnimation
    enableAnimation?: boolean
  }>(),
  {
    totalTime: 60,
    currentTime: 60,
    isRunning: false,
    enableAnimation: undefined
  }
)

// 2 * π * r (r=53) ≈ 333.01px
const RADIUS = 53
const TOTAL_PERIMETER = Math.round(2 * Math.PI * RADIUS) // 333

// 是否正在运行：优先使用 isRunning，若传了旧的 enableAnimation 也无缝兼容
const isRunning = computed(() => {
  if (props.enableAnimation !== undefined) {
    return props.enableAnimation
  }
  return props.isRunning
})

// 进度百分比：从 0 (刚开始) 到 1 (走完)
const progress = computed(() => {
  if (props.totalTime <= 0) return 1
  const elapsed = props.totalTime - props.currentTime
  return Math.max(0, Math.min(1, elapsed / props.totalTime))
})

// 圆环偏移量：从 0px 递增至 TOTAL_PERIMETER px
const dashOffset = computed(() => progress.value * TOTAL_PERIMETER)

// 小圆点旋转角度：起点 450deg，顺时针旋转一圈（450deg -> 90deg）
const dotRotation = computed(() => 450 - progress.value * 360)
</script>

<style scoped></style>
