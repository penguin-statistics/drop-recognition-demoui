<template>
  <v-row justify="center" align="center" class="ma-4 mt-0">
    <v-col cols="12">
      <v-dialog :origin="dialogOrigin" max-width="1800px" v-model="expandImage.dialog" scrollable :overlay-opacity=".8" overlay-color="rgba(0, 0, 0, 1)">
        <v-card style="cursor: zoom-out" @click="expandImage.dialog = false" v-ripple="false">
          <img :src="expandImage.src" alt="DebugImage" />
          <v-card-subtitle class="text-center mt-4">
            右键图片或长按图片可拷贝到剪贴板或保存图片；本图为 Debug Image，并非原图
          </v-card-subtitle>
<!--          <v-card-actions>-->
<!--            <v-btn large block text @click="expandImage.dialog = false">-->
<!--              关闭-->
<!--            </v-btn>-->
<!--          </v-card-actions>-->
        </v-card>
      </v-dialog>

      <v-alert color="warning" prominent icon="mdi-alert-circle" outlined>
        请留意：本测试页面仅供对适配完成新结算 UI 的结算图识别算法进行测试；识别结果暂不会汇报到企鹅物流
      </v-alert>

      <h2 class="header">
        食用指南
      </h2>
      <ol>
        <li>本版本的截图识别已适配于 2022 年 4 月 更新的新结算页面 UI</li>
        <li>图像文件仅会通过使用本地 WASM 技术进行识别，<strong>不会</strong>向服务器上传</li>
        <li>需要先进行<strong>初始化</strong>后才可开始识别</li>
        <li>在进行算法识别后，检测到<strong>「不合法」的物品将不会计入识别结果</strong>（例如已经过了活动时间的箱子、过了小样掉落时段的理智小样等）</li>
        <li>点击图片可以放大（便于核对），再次点击图片即可关闭</li>
<!--        <li>请<strong>毫不留情</strong>地测试，包括但不限于塞总和大于 4+ GB 的识别图像（应该没有内存泄露）、各种奇怪的截图、低分辨率和超低画质截图等等</li>-->
        <!-- <li>为了错误汇报规范化、提高解决效率考量，遇到问题、错误、网页"卡死"（进度条不走）等异常情况后，请前往 <v-btn color="primary" href="https://shimo.im/forms/D6CK8dqcxvgrHxxC/fill?channel=web" target="_blank">填写一个十分简短的表单 <v-icon right>mdi-open-in-new</v-icon></v-btn> 以帮助我们解决你所遇到的问题</li> -->
        <li>最后，测试愉快 :D</li>
      </ol>

<!--      <ThreadBlockDetector />-->

      <v-divider class="my-4" />

      <h3 class="grey--text my-2">输入 INPUT</h3>
      <v-form class="ml-6">
        <v-file-input outlined multiple label="识别图片队列" v-model="files" persistent-hint class="cursor-pointer my-4"
                      hint="仅支持使用小于 50MB 大小的图片 (image/*)" counter show-size
                      accept="image/*" small-chips :rules="rules"
        />
        <v-checkbox hide-details v-model="lots" label="对所有图像全部复制 100 份进行识别测试 (压测)" />
        <v-checkbox hide-details v-model="fastTest" label="快速测试模式：隐藏图片渲染、缩小栏宽度" class="mb-4" />
<!--        <v-checkbox hide-details v-model="onlyDraw" label="仅绘制图像" />-->

        <v-btn @click="init" color="orange" large class="mr-2" :loading="initializing" :disabled="initialized">
          {{ initialized ? "已成功初始化" : "初始化" }}
        </v-btn>

        <v-btn class="mr-2" @click="recognize" color="primary" large :disabled="!initialized || !files.length" :loading="recognition.busy">
          {{ initialized ? (files.length ? "开始识别" : "开始识别 (暂未选定任何图像)") : "等待初始化完成..." }}
        </v-btn>
<!--        <v-btn v-if="onlyDraw" @click="draw" color="primary" large>-->
<!--          绘制图像-->
<!--        </v-btn>-->
      </v-form>

      <v-expansion-panels class="mt-4 pl-5">
        <v-expansion-panel>
          <v-expansion-panel-header>
            调试信息 DEBUG
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <h5 class="grey--text mb-4">Console</h5>

            <div class="console" style="width: 100%; border: 1px solid white; background: rgba(0, 0, 0, .5); height: 300px; border-radius: 4px">
              <ul id="console">
              </ul>
            </div>

            <h5 class="grey--text mt-6 mb-4">WASM 堆内存 + IMAGE 图片解码元素：通过 img 元素解码图片、对已 _malloc、已写入图片数据的堆内存使用 Canvas 预览</h5>

            <div class="d-flex flex-row">
              <div class="mr-2 font-weight-bold black--text" style="border-radius: 4px; height: 36px; padding: 6px 12px; background: magenta">紫色：canvas 元素</div>
              <div class="mr-2 font-weight-bold black--text" style="border-radius: 4px; height: 36px; padding: 6px 12px; background: orange">橙色：img 元素</div>

              <v-btn @click="clearCanvas" color="secondary" class="mb-2">
                清空预览区（不会清空堆内存）
              </v-btn>
            </div>

            <div class="overflow-y-auto" id="canvases" ref="canvases">
            </div>

<!--            <h5 class="grey--text mt-6 mb-4">IMAGE 通过 img 元素解码图片的图片预览区</h5>-->

<!--            <v-btn @click="clearImages" color="secondary" class="mb-2">-->
<!--              清空图片预览区-->
<!--            </v-btn>-->

<!--            <div class="overflow-y-auto" id="images" ref="images">-->
<!--            </div>-->
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-expand-transition>
        <div v-if="recognition.busy || results.length" class="mt-4">

          <v-divider class="mb-4" />

          <h3 class="grey--text my-2">进度 PROGRESS</h3>

          <v-progress-linear class="quick-transition" :value="(results.length / files.length) * 100" :buffer-value="((results.length + 1) / files.length) * 100" stream height="28" striped>
            {{ results.length }} / {{ files.length }} ({{((results.length / (files.length === 0 ? 1 : files.length)) * 100).toFixed(0)}}%)
          </v-progress-linear>
        </div>
      </v-expand-transition>

      <v-divider class="my-4" />

      <h3 class="grey--text my-2">输出 OUTPUT</h3>
      <div class="ml-6">
        <v-row v-if="results.length">
          <v-col class="d-flex" cols="12" sm="6" md="4" lg="3" :xl="fastTest ? 1 : 2" v-for="result in results" :key="result.file.name">
            <v-card outlined :color="result.result.exceptions.length ? 'rgba(241,97,87,0.5)' : ''">
              <v-img v-if="!fastTest" v-ripple :src="result.blobUrl" contain @click="e => enlargeImage(result.blobUrl, e)" style="cursor: zoom-in"></v-img>
              <v-card-title class="d-flex flex-row align-center">
                <div class="d-flex align-baseline">
                  <small class="mr-2">关卡</small> <span class="monospace">{{ getStage(result.result.stage.stageId).code }}</span>
                </div>
                <v-spacer />
                <v-chip label class="subtitle-2">
                  耗时 {{result.duration.toFixed(2)}}ms
                </v-chip>
              </v-card-title>
              <v-card-subtitle>
                文件名：<span class="font-weight-bold">{{result.file.name || '(文件名未知)'}}</span>
              </v-card-subtitle>
              <v-card-text>
                <div class="d-inline-flex align-center justify-center flex-column pa-2 mr-2" style="border-radius: 4px; border: 1px solid white" v-for="item in result.result.dropArea.drops" :key="item.itemId">
                  <div>
                    {{ dropTypeToString(item.dropType) }}
                  </div>
                  <Item :itemId="item.itemId" :count="item.quantity" :confidence="item.confidence"/>
                </div>
                <v-alert outlined color="white" border="left" v-if="result.result.exceptions.length" icon="mdi-alert-circle">
                  识别时有错误发生
                  <ul>
                    <li v-if="result.result.exceptions.length">
                      Error: <br><code>{{result.result.exceptions}}</code>
                    </li>
                  </ul>
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else color="secondary" prominent border="left" class="mt-0" icon="mdi-numeric-0-box-multiple-outline">
          暂时没有识别结果
        </v-alert>
      </div>
    </v-col>
  </v-row>
</template>

<script>
import Recognizer from '@/utils/recognizer'
import Item from '@/components/Item'
import pdata from '@/models/pdata'

export default {
  name: 'Home',
  components: { Item },
  data () {
    return {
      recognizer: null,
      files: [],
      results: [],
      rules: [
        files => {
          for (const file of files) {
            if (file.size > 50e6) return `"${file.name}" (${(file.size / 1e6).toFixed(1)}MB) 超出大小限制`
          }
          return true
        }
      ],
      initializing: false,
      initialized: false,
      expandImage: {
        dialog: false,
        src: ''
      },
      recognition: {
        busy: false
      },
      dialogOrigin: '',
      lots: false,
      onlyDraw: false,
      fastTest: false
    }
  },
  mounted () {
    const old = window.console.log
    const logger = document.getElementById('console')
    const loggerWrapper = document.getElementsByClassName('console')[0]
    window.console.log = function (...message) {
      const item = document.createElement('li')
      item.innerText = `${new Date().toISOString()} ${message.join(' ').toString()}`
      if (logger) logger.appendChild(item)
      if (loggerWrapper) loggerWrapper.scrollTop = loggerWrapper.scrollHeight
      old(...message)
    }
  },
  methods: {
    init () {
      this.initializing = true

      this.recognizer = new Recognizer()
      window.recognizer = this.recognizer

      this.recognizer.initialize()
        .then(() => {
          this.initialized = true
          console.log('initialization completed')
        })
        .finally(() => {
          this.initializing = false
        })
    },
    draw () {
      for (const file of this.files) {
        this.drawImageToPreview(file)
      }
    },
    stringify (s) {
      return JSON.stringify(s, null, 4)
    },
    async recognize () {
      this.results = []
      this.recognition.busy = true

      const typeOrder = ['NORMAL_DROP', 'SPECIAL_DROP', 'EXTRA_DROP']
      typeOrder.reverse()

      if (this.lots) {
        const repeated = []
        for (const file of this.files) {
          repeated.push(...Array(100).fill(file))
        }
        console.log(repeated)
        this.files = repeated
      }

      await this.recognizer.recognize(this.files, (result) => {
        result.result.dropArea.drops.map(el => {
          el.confidence = parseFloat(el.confidence[el.itemId])
          el.quantity = parseFloat(el.quantity.quantity)
        }).sort((a, b) => {
          return -typeOrder.indexOf(a.dropType) - (-typeOrder.indexOf(b.dropType))
        })
        this.results.push(result)
      })

      console.log(this.results)

      this.recognition.busy = false
    },
    async drawImageToPreview (blob) {
      const img = document.createElement('img')
      const c = document.querySelector('#canvases')
      if (c) c.prepend(img)
      img.src = URL.createObjectURL(blob)

      return new Promise(resolve => {
        img.onload = function () {
          console.log(this.naturalWidth, this.naturalHeight, img.width, img.height)
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          // ctx.drawImage(img, 0, 0, img.width, img.height)
          ctx.drawImage(img, 0, 0)
          // const s = document.getElementById('canvases')
          // if (s) s.prepend(canvas)

          const image = ctx.getImageData(0, 0, img.width, img.height)
          console.log(blob.name, image.data.slice(272, 276))

          resolve()
        }
      })
    },
    clearCanvas () {
      this.$refs.canvases.innerHTML = ''
    },
    clearImages () {
      this.$refs.images.innerHTML = ''
    },
    dropTypeToString (type) {
      const map = {
        EXTRA_DROP: '额外物资',
        SPECIAL_DROP: '特殊掉落',
        NORMAL_DROP: '常规掉落',
        FURNITURE: '家具'
      }
      return map[type] || type
    },
    enlargeImage (url, event) {
      this.dialogOrigin = `${event.clientX}px ${event.clientY}px`
      this.$nextTick(() => {
        this.expandImage.dialog = true
        this.recognizer.generateDebugImage(url)
          .then(image => {
            this.expandImage.src = image
          })
        // this.expandImage.src = url
      })
    },
    getStage (stageId) {
      return pdata.stage.byStageId(stageId) || { code: '(识别失败)' }
    }
  }
}
</script>

<style>
.cursor-pointer .v-file-input__text {
  cursor: pointer !important;
}
#canvases > * {
  border-radius: 4px; background: rgba(0, 0, 255, .1); margin: 4px 8px 4px 0;
}
#canvases > canvas {
  border: 2px solid #bf30bf;
}
#canvases > img {
  border: 2px solid #bf8f30 !important;
}
.console, .monospace-pure, .monospace {
  font-family: ".AppleSystemUIFontMonospaced", Consolas, monospace;
  font-weight: bold;
  letter-spacing: -.05rem;
}
.monospace {
  background: white;
  color: black;
  padding: 0 .5em;
  border-radius: 4px;
}
.console {
  padding: .5rem 1rem;
  overflow-y: scroll;
}
.console ul {
  list-style: none;
  padding-left: 0;
}
.quick-transition {
  transition-duration: 20ms !important;
}
h2.header {
  margin-bottom: .25rem;
}
ol > li {
  margin-bottom: .1rem;
}
</style>
