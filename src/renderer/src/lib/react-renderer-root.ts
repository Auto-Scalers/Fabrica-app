import { createRoot, type Root } from 'react-dom/client'

type RendererRootHotData = {
  FABRICARendererRoot?: Root
}

export function getOrCreateRendererRoot(
  container: HTMLElement,
  hotData?: RendererRootHotData
): Root {
  const existingRoot = hotData?.FABRICARendererRoot
  if (existingRoot) {
    return existingRoot
  }
  const root = createRoot(container)
  if (hotData) {
    hotData.FABRICARendererRoot = root
  }
  return root
}
