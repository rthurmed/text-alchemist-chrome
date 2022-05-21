// 'Text Alchemist' chrome extension
// author: Arthur Medeiros (rthurmedeiros@gmail.com)

// ------ TRANSFORMERS ------
const prefix = 'text-alchemist-'

const transformer = ({
  id = '',
  title = '',
  call = (text = '') => text
}) => ({
  id: prefix + id,
  title,
  call
})

export const transformers = [
  transformer({
    id: 'uppercase',
    title: 'Uppercase',
    call: (text) => text.toUpperCase()
  }),
  transformer({
    id: 'lowercase',
    title: 'Lowercase',
    call: (text) => text.toLowerCase()
  })
]


// ------ CONTEXT MENU SETUP ------
const { contextMenus, scripting, tabs, storage } = chrome
const mainMenuId = "transform-text"

contextMenus.create({
  id: mainMenuId,
  title: "Transform text",
  contexts: ['editable']
})

transformers.forEach((transformer) => {
  contextMenus.create({
    id: transformer.id,
    title: transformer.title,
    contexts: ['editable'],
    parentId: mainMenuId
  })
})


// ------ CONTEXT MENU ACTION ------
contextMenus.onClicked.addListener(async (event) => {
  const { menuItemId, selectionText, frameId } = event

  const originalValue = selectionText
  const value = applyTextTransform(menuItemId, originalValue)
  const result = {
    value,
    originalValue
  }

  storage.local.set({ result })

  const currentTab = await getCurrentTab()
  scripting.executeScript({
    target: {
      tabId: currentTab.id,
      frameIds: [frameId]
    },
    function: applyChangesInDocument
  })
})

const applyChangesInDocument = () => {
  chrome.storage.local.get(['result'], ({ result }) => {
    const { value, originalValue } = result
    let currentValue = document.activeElement.value
    currentValue = currentValue.replace(originalValue, value)
    document.activeElement.value = currentValue
  })
}

const applyTextTransform = (menuItemId, selectionText) => {
  const transformer = transformers.find(i => i.id == menuItemId)
  if (transformer == null) { return selectionText }
  return transformer.call(selectionText)
}

const getCurrentTab = async () => {
  const [tab] = await tabs.query({
    active: true,
    currentWindow: true
  })
  return tab
}
