<template>
  <v-container class="mt-4 pa-6">
    <v-row justify="center" align="center">
      <v-col cols="12">
        <h1>WebAssembly Demo</h1>

        <ThreadBlockDetector />

        <v-form>
          <v-file-input outlined label="图片" v-model="file" hide-details class="cursor-pointer my-4"
                        accept="image/jpeg, image/jpg, image/png"
          />
          <v-btn @click="doConvertion" color="primary" block large>
            转换
          </v-btn>
        </v-form>

        <pre
          id="console" v-html="result" class="mt-6"
          style="background: black; color: white; overflow: auto; min-height: 40vh; border: 1px solid white; padding: 8px; border-radius: 4px"
        ></pre>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable no-undef */
import ThreadBlockDetector from '@/views/ThreadBlockDetector'
export default {
  name: 'WasmDemo',
  components: { ThreadBlockDetector },
  data () {
    return {
      file: null,
      result: ''
    }
  },
  methods: {
    async doConvertion () {
      // const reader = new FileReader()
      // reader.onload = function () {
      //
      // }
      // reader.readAsArrayBuffer(this.file)

      const arrayBuffer = await this.file.arrayBuffer()
      const array = new Uint8Array(arrayBuffer)
      this.result = convert(array)
    }
  }
}
</script>

<style scoped>

</style>
