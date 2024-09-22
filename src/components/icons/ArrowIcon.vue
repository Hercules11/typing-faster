<template>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    class="u-ml-xs"
    :class="props.direction ? 'downside' : 'upside'"
    data-reactid=".0.1.2.0.1"
  >
    <path
      d="M6 10l6 6 6-6"
      stroke="#22272F"
      stroke-width="2"
      stroke-linecap="round"
      data-reactid=".0.1.2.0.1.0"
    ></path>
  </svg>
</template>

<script lang="ts" setup>
const props = defineProps(['direction'])
</script>

<style lang="less" scoped>
.downside {
  vertical-align: middle;
  transition: 0.4s;
  margin-left: 0.5rem;
  transform-origin: center center 0px;
  transform: rotate(0deg);
}

.upside {
  vertical-align: middle;
  transition: 0.4s;
  margin-left: 0.5rem;
  transform-origin: center center 0px;
  transform: rotate(-180deg);
}
</style>
