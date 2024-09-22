<template>
  <svg
    viewBox="0 0 110 110"
    width="110"
    height="110"
    ref="target"
    data-reactid=".0.1.1.0.0.$=10.2.0.0.0"
  >
    <circle
      cx="55"
      cy="55"
      r="53"
      fill="none"
      stroke="#FFD000"
      stroke-width="4"
      stroke-dasharray="332px"
      style="
        transform: rotate(-90deg);
        transform-origin: center center 0px;
        transition: 1s linear;
        stroke-dashoffset: 0px;
      "
      data-reactid=".0.1.1.0.0.$=10.2.0.0.0.0"
    ></circle>
    <circle
      cx="2"
      cy="55"
      r="2"
      fill="#FFD000"
      style="transform-origin: 55px 55px 0px; transition: 1s linear; transform: rotate(450deg)"
      data-reactid=".0.1.1.0.0.$=10.2.0.0.0.1"
    ></circle>
  </svg>
</template>
<script setup lang="ts">
import { watch, ref } from 'vue'

const props = defineProps(['enableAnimation'])
const target = ref()
watch(
  () => props.enableAnimation,
  (newVal) => {
    console.log(props.enableAnimation, newVal)

    if (newVal) {
      let size = 0
      let deg = 450
      const intervalId = setInterval(() => {
        if (size >= 332) {
          clearInterval(intervalId)
        }
        size += 332 / 60
        deg -= 6
        target.value.children[0].style['stroke-dashoffset' as any] = `${size}px`
        target.value.children[1].style['transform' as any] = `rotate(${deg}deg)`
      }, 1000)
    } else {
      // 恢复初始状态
      // TODO: // 完成后没有立即执行
      console.log('恢复动画')
      target.value.children[0].style['stroke-dashoffset' as any] = '0px'
      target.value.children[1].style['transform' as any] = 'rotate(450deg)'
    }
  }
)
</script>
<style scoped></style>
