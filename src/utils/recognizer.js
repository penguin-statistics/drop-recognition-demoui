import preloads from '@/models/preloads'
// import Jimp from 'jimp'
import JSZip from 'jszip'
const Module = window.Module

// function addCanvas (canvas, url, small = false) {
//   // canvas.style.height = small ? '80px' : '264px'
//   // if (!small) canvas.style.float = 'left'
//   canvas.setAttribute('data-title', new Date().toLocaleString())
//   canvas.setAttribute('data-url', url)
//   const s = document.getElementById('canvases')
//   if (s) s.prepend(canvas)
// }

async function image2wasmHeapOffset (blob) {
  console.time('writeToWasmHeap')
  const imageData = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = function (event) {
      resolve(event.target.result)
    }
    reader.readAsArrayBuffer(blob)
  })
  const uint8 = new Uint8Array(imageData)

  const numBytes = uint8.length
  const dataPtr = Module._malloc(numBytes)
  const dataOnHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, numBytes)
  dataOnHeap.set(uint8)
  console.timeEnd('writeToWasmHeap')

  return {
    offset: dataOnHeap.byteOffset,
    length: numBytes,
    blobUrl: URL.createObjectURL(blob)
  }
}

async function file2ArrayBuffer(file) {
  const reader = new FileReader()
  return new Promise((resolve) => {
    reader.onload = function (event) {
      resolve(event.target.result)
    }
    reader.readAsArrayBuffer(file)
  })
}

class Recognizer {
  async initialize () {
    this.wasm = {
      // recognize: Module.cwrap('recognize', 'string', ['number', 'number']),
      // preload_json: Module.cwrap('preload_json', 'void', ['string', 'string', 'string']),
      // preload_tmpl: Module.cwrap('preload_templ', 'void', ['string', 'number'])
      // // free_buffer: Module.cwrap('free_buffer', 'void', ['number'])
      loadServer: Module.load_server,
      loadTemplates: Module.load_templs,
      loadHashIndex: Module.load_hash_index,
      loadStageIndex: Module.load_stage_index
    }

    console.log('preloading json')

    this.wasm.loadServer('CN')

    const stage = JSON.stringify(preloads.stage)
    console.log('preloading stage', stage)
    this.wasm.loadStageIndex(stage)

    const hash = JSON.stringify(preloads.hash)
    console.log('preloading hash', hash)
    this.wasm.loadHashIndex(JSON.stringify(preloads.hash))

    console.log('json preloaded')

    console.log('starting to preload item icons')

    // const items = ['2001', '2002', '2003', '2004', '30011', '30012', '30013', '30014', '30021', '30022', '30023', '30024', '3003', '30031', '30032', '30033', '30034', '30041', '30042', '30043', '30044', '30051', '30052', '30053', '30054', '30061', '30062', '30063', '30064', '30073', '30074', '30083', '30084', '30093', '30094', '30103', '30104', '30115', '30125', '30135', '30145', '31013', '31014', '31023', '31024', '31033', '31034', '3112', '3113', '3114', '3211', '3212', '3221', '3222', '3231', '3232', '3241', '3242', '3251', '3252', '3261', '3262', '3271', '3272', '3281', '3282', '3301', '3302', '3303', '4005', 'ap_supply_lt_010', 'randomMaterial_1', 'randomMaterial_2', 'randomMaterial_3', 'randomMaterial_4']
    const self = this

    await fetch('items.zip')
      .then((response) => {
        if (response.status >= 200 && response.status < 400) {
          return Promise.resolve(response.blob())
        } else {
          return Promise.reject(new Error(response.statusText))
        }
      })
      .then(JSZip.loadAsync)
      .then(async function (zip) {
        console.log('zip file list', zip.files)
        for (const itemFileName of Object.keys(zip.files)) {
          const itemId = itemFileName.split('.')[0]
          const buffer = await zip.file(itemFileName).async('arraybuffer')
          console.log('adding', itemId, 'to preloaded item icon using', buffer)

          // console.log('item', item, 'image', image, 'imageData', imageData, 'numBytes', numBytes, 'dataPtr', dataPtr, 'dataOnHeap', dataOnHeap)
          // console.log('preloading template. itemId:', item)
          // const { offset, length } = await image2wasmHeapOffset(blob)
          self.wasm.loadTemplates(itemId, buffer)
        }
      })

    return this
  }

  async recognize (files, resultCb) {
    console.log(`env check: ${Module.env_check()}`)

    for (const file of files) {
      console.groupCollapsed('Recognition logs for', file.name)
      console.log('start recognizing file', file.name)
      console.time(file.name)
      const start = performance.now()
      const recognizer = new Module.Recognizer('RESULT')
      const buffer = await file2ArrayBuffer(file)
      console.log('buffer', buffer)
      const blobUrl = URL.createObjectURL(file)
      let result
      try {
        result = recognizer.recognize(buffer, true, false)
      } catch (e) {
        console.error('recognize error', e)
        console.error('recognize error from instance', Module.getExceptionMessage(e))
      }
      const duration = performance.now() - start
      console.log('recognized with result', result, 'executing callback')
      console.timeLog(file.name)
      const parsedResult = JSON.parse(result) || { errors: [], drops: [] }
      console.debug('recognition result', parsedResult)
      resultCb({
        file,
        blobUrl: blobUrl,
        duration,
        result: parsedResult
      })
      console.timeLog(file.name)
      // this.wasm.free_buffer(data.offset)
      console.log('buffer freed. timer ended')
      console.timeEnd(file.name)
      console.groupEnd()
    }
  }
}

export default Recognizer
