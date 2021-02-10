import items from './items'
import stages from './stages'

export default {
  item: {
    byItemId (itemId) {
      return items.find(el => el.itemId === itemId)
    }
  },
  stage: {
    byStageId (stageId) {
      return stages.find(el => el.stageId === stageId)
    }
  }
}
