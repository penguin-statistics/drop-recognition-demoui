<template>
  <v-row justify="center" align="center" class="ma-4 mt-0">
    <v-col cols="12">
      <v-dialog :origin="dialogOrigin" max-width="1800px" v-model="expandImage.dialog" scrollable :overlay-opacity=".8" overlay-color="rgba(0, 0, 0, 1)">
        <v-card style="cursor: zoom-out" @click="expandImage.dialog = false" v-ripple="false">
          <img :src="expandImage.src" alt="enlarged" />
          <v-card-subtitle class="text-center mt-4">
            右键图片或长按图片可拷贝到剪贴板或保存图片
          </v-card-subtitle>
<!--          <v-card-actions>-->
<!--            <v-btn large block text @click="expandImage.dialog = false">-->
<!--              关闭-->
<!--            </v-btn>-->
<!--          </v-card-actions>-->
        </v-card>
      </v-dialog>

      <v-alert color="warning" prominent icon="mdi-alert-circle" outlined>
        请留意：本测试页面仅供对新开发完成的结算图识别算法进行测试，识别结果暂不会汇报到企鹅物流
      </v-alert>

      <h2>
        食用指南
      </h2>
      <ol>
        <li>图像文件仅会通过使用本地 WASM 技术进行识别，<strong>不会</strong>向服务器上传</li>
        <li><del>需要先进行<strong>初始化</strong>后才可开始识别。</del>现在可以一键识别啦</li>
        <li>在进行算法识别后，检测到<strong>「不合法」的物品将不会计入识别结果</strong>（例如已经过了活动时间的箱子、过了小样掉落时段的理智小样等）</li>
        <li>点击图片可以放大（便于核对），再次点击图片即可关闭</li>
<!--        <li>请<strong>毫不留情</strong>地测试，包括但不限于塞总和大于 4+ GB 的识别图像（应该没有内存泄露）、各种奇怪的截图、低分辨率和超低画质截图等等</li>-->
        <li>为了错误汇报规范化、提高解决效率考量，遇到问题、错误、网页"卡死"（进度条不走）等异常情况后，请前往 <v-btn color="primary" href="https://shimo.im/forms/D6CK8dqcxvgrHxxC/fill?channel=web" target="_blank">填写一个十分简短的表单 <v-icon right>mdi-open-in-new</v-icon></v-btn> 以帮助我们解决你所遇到的问题</li>
        <li>最后，测试愉快 :D</li>
      </ol>
      <h2>
        Martin's Extra Notes
      </h2>
      <p>
        我只是来换个UI的，所以请重点测试以下内容
      </p>
      <ol>
        <li>从Input 到 Output 的丝滑程度</li>
        <li>输入Input 的 Drag and Drop 功能</li>
      </ol>

      <!--      <ThreadBlockDetector />-->

      <v-divider class="my-4" />
      <v-stepper
        v-model="step"
        vertical
      >
        <v-stepper-step
          :complete="step > 1"
          step="1"
        >
          输入 Input
        </v-stepper-step>
        <v-stepper-content step="1">
          <v-form class="ml-6">
            <imageDrop v-model="files" />
            <v-switch
              v-model="fastTest"
              hide-details
              label="简洁模式：隐藏图片渲染、缩小栏宽度"
              class="mb-4"
            />

            <v-btn
              color="primary"
              large
              :disabled="!files.length"
              @click="initAndRecognize"
            >
              {{ files.length ? "开始识别" : "开始识别 (暂未选定任何图像)" }}
            </v-btn>
            <v-expansion-panels
              class="mt-4"
              focusable
            >
              <v-expansion-panel>
                <v-expansion-panel-header>
                  高级设定 Advanced
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-checkbox
                    v-model="lots"
                    hide-details
                    label="对所有图像全部复制 100 份进行识别测试"
                  />
              <!--        <v-checkbox hide-details v-model="onlyDraw" label="仅绘制图像" />-->
              <!--        <v-btn v-if="onlyDraw" @click="draw" color="primary" large>-->
              <!--          绘制图像-->
              <!--        </v-btn>-->
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-stepper-content>
        <v-stepper-step
          :complete="step > 2"
          step="2"
        >
          掉落识别中 Drop Recognizing
        </v-stepper-step>

        <v-stepper-content step="2">
          <p class="text-center">Use Component PreloaderInline</p>
          <p class="text-center"><code>g桑知道，小声</code></p>
          <h3 class="grey--text my-2">
            进度 PROGRESS
          </h3>
          <v-progress-linear
            v-if="initializing"
            indeterminate
            class="quick-transition"
            stream
            height="28"
            striped
          >
            初始化中...
          </v-progress-linear>
          <v-progress-linear
            v-else
            class="quick-transition"
            :value="(results.length / files.length) * 100"
            :buffer-value="((results.length + 1) / files.length) * 100"
            stream
            height="28"
            striped
          >
            {{ results.length }} / {{ files.length }} ({{ ((results.length / (files.length === 0 ? 1 : files.length)) * 100).toFixed(0) }}%)
          </v-progress-linear>
        </v-stepper-content>

        <v-stepper-step
         :complete="step > 3"
         step="3"
        >
          掉落识别结果与(更正) Drop Recognition Result and (Correction)
        </v-stepper-step>

        <v-stepper-content step="3">
        <v-select
            v-model="filterValue"
            :items="filterItems"
            attach
            chips
            label="Filter"
            multiple
          ></v-select>

          <div class="ml-6">
          <v-row v-if="results.length">
            <v-col
              v-for="result in filteredResults"
              :key="result.file.name"
              class="d-flex"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              :xl="fastTest ? 1 : 2"
            >
              <v-card
                outlined
                :color="result.result.errors.length ? 'rgba(241,97,87,0.5)' : (result.result.warnings.length ? 'warning' : '')"
              >
                <v-img
                  v-if="!fastTest"
                  v-ripple
                  :src="result.blobUrl"
                  contain
                  style="cursor: zoom-in"
                  @click="e => enlargeImage(result.blobUrl, e)"
                />
                <v-card-title class="d-flex flex-row align-center">
                  <div class="d-flex align-baseline">
                    <small class="mr-2">关卡</small> <span class="monospace">{{ getStage(result.result.stageId).code }}</span>
                  </div>
                  <v-spacer />
                  <v-chip
                    label
                    class="subtitle-2"
                  >
                    耗时 {{ result.duration.toFixed(2) }}ms
                  </v-chip>
                </v-card-title>
                <v-card-subtitle>
                  文件名：<span class="font-weight-bold">{{ result.file.name || '(文件名未知)' }}</span>
                </v-card-subtitle>
                <v-card-text>
                  <div
                    v-for="item in result.result.drops"
                    :key="item.itemId"
                    class="d-inline-flex align-center justify-center flex-column pa-2 mr-2"
                    style="border-radius: 4px; border: 1px solid white"
                  >
                    <div>
                      {{ dropTypeToString(item.dropType) }}
                    </div>
                    <Item
                      :item-id="item.itemId"
                      :count="item.quantity"
                      :confidence="item.confidence"
                    />
                  </div>
                  <v-alert
                    v-if="result.result.errors.length || result.result.warnings.length"
                    outlined
                    color="white"
                    border="left"
                    icon="mdi-alert-circle"
                  >
                    识别时有错误发生
                    <ul>
                      <li v-if="result.result.errors.length">
                        Error: <br><code>{{ result.result.errors }}</code>
                      </li>
                      <li v-if="result.result.warnings.length">
                        Warning: <br><code>{{ result.result.warnings }}</code>
                      </li>
                    </ul>
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-alert
            v-else
            color="secondary"
            prominent
            border="left"
            class="mt-0"
            icon="mdi-numeric-0-box-multiple-outline"
          >
            暂时没有识别结果
          </v-alert>
        </div>

          <v-btn
            color="primary mt-4"
            @click="step = 4"
          >
            (假装)确认并上报
            <v-icon
              right
              dark
            >
              mdi-upload
            </v-icon>
          </v-btn>
        </v-stepper-content>
        <v-stepper-step step="4">
          (假装)掉落上报 (NotImplementedError) Drop Report
        </v-stepper-step>

        <v-stepper-content step="4">
          <v-card
            class="mb-12 text-center"
            height="200px"
          >
            恭喜你上报成功（假装）
          </v-card>

          <v-btn
            color="primary"
            @click="step = 1"
          >
            回到第一步
          </v-btn>

        </v-stepper-content>
      </v-stepper>

      <v-divider class="my-4" />

      <v-expansion-panels
        class="mt-4"
        focusable
      >
        <v-expansion-panel>
          <v-expansion-panel-header>
            调试信息 DEBUG (可能被弃用了唔)
          </v-expansion-panel-header>
          <v-expansion-panel-content>

            <h5 class="grey--text mb-4">
              Console
            </h5>

            <div
              class="console"
              style="width: 100%; border: 1px solid white; background: rgba(0, 0, 0, .5); height: 300px; border-radius: 4px"
            >
              <ul id="console" />
            </div>

            <h5 class="grey--text mt-6 mb-4">
              WASM 堆内存 + IMAGE 图片解码元素：通过 img 元素解码图片、对已 _malloc、已写入图片数据的堆内存使用 Canvas 预览
            </h5>

            <div class="d-flex flex-row">
              <div
                class="mr-2 font-weight-bold black--text"
                style="border-radius: 4px; height: 36px; padding: 6px 12px; background: magenta"
              >
                紫色：canvas 元素
              </div>
              <div
                class="mr-2 font-weight-bold black--text"
                style="border-radius: 4px; height: 36px; padding: 6px 12px; background: orange"
              >
                橙色：img 元素
              </div>

              <v-btn
                color="secondary"
                class="mb-2"
                @click="clearCanvas"
              >
                清空预览区（不会清空堆内存）
              </v-btn>
            </div>

            <div
              id="canvases"
              ref="canvases"
              class="overflow-y-auto"
            />

            <!--            <h5 class="grey--text mt-6 mb-4">IMAGE 通过 img 元素解码图片的图片预览区</h5>-->

            <!--            <v-btn @click="clearImages" color="secondary" class="mb-2">-->
            <!--              清空图片预览区-->
            <!--            </v-btn>-->

            <!--            <div class="overflow-y-auto" id="images" ref="images">-->
            <!--            </div>-->
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script>
import Recognizer from '@/utils/recognizer'
import Item from '@/components/Item'
import pdata from '@/models/pdata'
import ImageDrop from '@/components/ImageDrop'

export default {
  name: 'Home',
  components: { Item, ImageDrop },
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
      fastTest: false,
      step: 1,
      filterItems: ['Success', 'Warning', 'Error'],
      filterValue: ['Success', 'Warning', 'Error']
    }
  },
  computed: {
    filteredResults () {
      var result = this.results.filter((result) => {
        for (var key of this.filterValue) {
          console.log(key)
          switch (key) {
            case 'Success':
              if (!(result.result.warnings.length || result.result.errors.length)) {
                return true
              }
              break
            case 'Warning':
              if (result.result.warnings.length) {
                return true
              }
              break
            case 'Error':
              if (result.result.errors.length) {
                return true
              }
              break
            default:
              return false
          }
        }
        return false
      })
      console.log('filtered')
      console.log(result)
      return result
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
    async init () {
      this.initializing = true

      this.recognizer = new Recognizer()

      await this.recognizer.initialize()
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
        result.result.drops.map(el => {
          el.confidence = parseFloat(el.confidence)
          el.quantity = parseFloat(el.quantity)
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
      console.log(event)
      this.dialogOrigin = `${event.clientX}px ${event.clientY}px`
      this.$nextTick(() => {
        this.expandImage.dialog = true
        this.expandImage.src = url
      })
    },
    getStage (stageId) {
      return pdata.stage.byStageId(stageId) || { code: '(识别失败)' }
    },
    async initAndRecognize () {
      this.step = 2
      await this.init()
      await this.recognize()
      console.log(this.results)
      this.step = 3
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
</style>
