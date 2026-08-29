import type { Page } from '@autoscalers/playwright-test'

export async function installRendererTitleLog(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as {
      __FABRICAE2eTitleLog?: string[]
      __FABRICAE2eTitleUnsubscribe?: () => void
    }
    const store = window.__store
    if (!store) {
      throw new Error('window.__store is not available')
    }

    w.__FABRICAE2eTitleUnsubscribe?.()
    w.__FABRICAE2eTitleLog = []

    const recordTitles = (): void => {
      const state = store.getState()
      const paneTitles = Object.values(state.runtimePaneTitlesByTabId ?? {}).flatMap((byPane) =>
        Object.values(byPane ?? {})
      )
      const tabTitles = Object.values(state.tabsByWorktree ?? {})
        .flat()
        .map((tab) => tab.title)

      for (const title of [...paneTitles, ...tabTitles]) {
        if (typeof title === 'string') {
          w.__FABRICAE2eTitleLog!.push(title)
        }
      }
    }

    // Why: shell prompts can immediately overwrite OSC titles. Logging every
    // renderer title state lets tests assert transient title frames landed.
    recordTitles()
    w.__FABRICAE2eTitleUnsubscribe = store.subscribe(recordTitles)
  })
}

export async function getRendererTitleLog(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __FABRICAE2eTitleLog?: string[] }
    return w.__FABRICAE2eTitleLog ?? []
  })
}
