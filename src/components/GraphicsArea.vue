<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
import {
  Chart,
  Colors,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip
} from 'chart.js'
import data from '../data/graphics.json'

// 缺了 tooltip 没注册，居然不报错提示
Chart.register(Colors, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

import ArrowIcon from './icons/ArrowIcon.vue'

const isShow = ref(true)
const area: Ref<HTMLCanvasElement | undefined> = ref()

onMounted(() => {
  new Chart(area.value?.getContext('2d')!, {
    type: 'bar',
    options: {
      animation: false,
      responsive: true, // 确保响应式
      maintainAspectRatio: false, // 不保持宽高比
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              // console.log(context)
              let val = context[0].raw
              return `${val} people write`
            },
            label: function (context) {
              let val = context.label
              return `${val} words per minute`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font: {
              size: 12
            },
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index) {
              return index % 10 === 0 ? this.getLabelForValue(value as number) : ''
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          }
        }
      }
    },
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: 'count',
          backgroundColor: '#ffd000',
          data: Object.values(data)
        }
      ]
    }
  })
})
</script>

<template>
  <div>
    <!-- 根元素的样式会被父级组件影响 -->
    <!-- 子组件的根节点会同时被父组件的作用域样式和子组件的作用域样式影响。这样设计是为了让父组件可以从布局的角度出发，调整其子组件根元素的样式。 -->
    <div class="container">
      <div class="title" @click="isShow = !isShow">
        <span>{{ isShow ? $t('hide') : $t('show') }}</span>
        <span><ArrowIcon :direction="isShow" /></span>
      </div>
      <div class="content" v-show="isShow">
        <div class="white-bg">
          <div class="graphics-title">
            <h1>{{ $t('scores') }}</h1>
            <h2>{{ $t('chart') }} ({{ $t('unit.wpm') }})</h2>
          </div>
          <div class="graphics-area">
            <canvas ref="area" id="global-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  max-width: 72.5rem;
  height: 100vh;
  margin: auto;
}
.content {
  border: 0 solid #d4d4d7;
  border-radius: 0.5rem;
  padding: 3rem 0 3rem;

  .white-bg {
    padding: 3rem 1rem 2rem;
    background-color: white;
  }
  @media (min-width: 64rem) {
    .white-bg {
      padding-right: 4rem;
      padding-left: 4rem;
    }
  }
  @media (min-width: 48rem) {
    .white-bg {
      padding-top: 4rem;
      padding-bottom: 3rem;
    }
  }

  .graphics-area {
    #global-chart {
      max-height: 300px;

      display: block;
      width: 992px;
      height: 300px;
      animation: chartjs-render-animation 0.001s;
    }
    @media screen and (max-width: 768px) {
      #global-chart {
        max-height: 180px;
      }
    }
  }

  .graphics-title {
    text-align: center;
    h1 {
      margin: 0 0 2rem;

      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.035em;
    }
    h2 {
      margin-bottom: 0.5em;
      font-weight: 400;
      line-height: 1.35;
      letter-spacing: -0.02em;
    }
    @media (min-width: 75rem) {
      h1 {
        font-size: 3.41545248rem;
      }
      h2 {
        font-size: 1.485rem;
      }
    }
  }
}
.title {
  text-align: center;
  font-weight: 400;
  font-size: 1.125rem;
  cursor: pointer;

  margin-bottom: 2rem;
}
.title:hover {
  text-decoration: underline;
}

@keyframes chartjs-render-animation {
  from {
    opacity: 0.99;
  }
  to {
    opacity: 1;
  }
}
</style>
