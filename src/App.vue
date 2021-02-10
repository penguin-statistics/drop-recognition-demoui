<template>
  <v-app>
    <v-app-bar
      app
      color="secondary"
      dark
    >
      <h1 class="d-flex align-center title mx-2">
        🐧
      </h1>

      <h2 class="d-flex align-center"><span class="mr-2">掉落识别</span> <v-chip label class="title font-weight-bold" color="indigo" style="height: 36px">公测</v-chip> </h2>

      <v-spacer></v-spacer>

      <v-chip label small color="orange">
        <v-icon left small>
          mdi-alert-circle
        </v-icon>
        本测试页面的识别结果不会汇报到企鹅物流
      </v-chip>

<!--      <v-btn-->
<!--        href="https://github.com/penguin-statistics"-->
<!--        target="_blank"-->
<!--        outlined-->
<!--        small-->
<!--      >-->
<!--        GitHub-->
<!--      </v-btn>-->
    </v-app-bar>

    <v-main class="mt-4">
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App'
}
</script>
