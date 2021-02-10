<template>
  <div class="animation d-flex align-center justify-center text-center display-1 my-8">
    :D
  </div>
</template>

<script>
export default {
name: "ThreadBlockDetector"
}
</script>

<style scoped>
.animation {
  display: flex;
  animation: animation 5s cubic-bezier(0.45, 0, 0.55, 1) alternate infinite;
}
@keyframes animation {
  from {
    transform: translateX(-30vw);
  }
  to {
    transform: translateX(30vw);
  }
}
</style>
