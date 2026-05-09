<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    data: number[]
    color?: string
    width?: number
    height?: number
    strokeWidth?: number
  }>(),
  {
    color: '#00BAB4',
    width: 120,
    height: 36,
    strokeWidth: 1.6,
  }
)

const uid = `spark-${Math.random().toString(36).slice(2, 9)}`

const points = computed(() => {
  const data = props.data
  if (!data || data.length === 0) return []
  const max = Math.max(...data, 0.0001)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = data.length > 1 ? props.width / (data.length - 1) : 0
  const padY = props.height * 0.15
  const usable = props.height - padY * 2
  return data.map((d, i) => {
    const x = i * stepX
    const y = props.height - padY - ((d - min) / range) * usable
    return { x, y, value: d }
  })
})

const linePath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const line = linePath.value
  return `${line} L ${props.width} ${props.height} L 0 ${props.height} Z`
})

const lastPoint = computed(() => points.value[points.value.length - 1])
const fillId = `${uid}-fill`
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" style="display: block; overflow: visible">
    <defs>
      <linearGradient :id="fillId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="color" stop-opacity="0.45" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>

    <path v-if="areaPath" :d="areaPath" :fill="`url(#${fillId})`" />
    <path
      v-if="linePath"
      :d="linePath"
      :stroke="color"
      :stroke-width="strokeWidth"
      fill="none"
      stroke-linejoin="round"
      stroke-linecap="round"
      class="spark-line"
      :style="{ filter: `drop-shadow(0 0 3px ${color}aa)` }"
    />

    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="3"
      :fill="color"
      :style="{ filter: `drop-shadow(0 0 5px ${color})` }"
    />
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="6"
      :fill="color"
      opacity="0.18"
      class="spark-pulse"
    />
  </svg>
</template>

<style scoped>
.spark-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}

.spark-pulse {
  transform-origin: center;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.18; r: 6; }
  50%      { opacity: 0.05; r: 9; }
}
</style>
