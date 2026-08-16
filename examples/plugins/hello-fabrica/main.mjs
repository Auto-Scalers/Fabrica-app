// Sample Fabrica plugin worker entry. Runs inside the out-of-process plugin
// worker (plain Node, no Electron), forked lazily on the first trigger. The
// default export receives the `fabrica` API: command registration, event
// handlers, and the capability-gated host API.
export default function activate(fabrica) {
  fabrica.commands.register('hello-ping', async (args) => {
    const stored = await fabrica.host.call('storage.get', { key: 'pings' })
    const count = (typeof stored?.value === 'number' ? stored.value : 0) + 1
    await fabrica.host.call('storage.set', { key: 'pings', value: count })
    return { pong: true, count, args: args ?? null }
  })

  fabrica.events.on('worktree.created', async (payload) => {
    fabrica.log(`worktree created: ${payload.worktreeId} at ${payload.path}`)
    await fabrica.host.call('notifications.show', {
      title: 'Worktree created',
      body: payload.path
    })
  })

  fabrica.events.on('agent.status.changed', (payload) => {
    fabrica.log(`agent status: ${payload.state} in ${payload.worktreeId ?? 'unknown worktree'}`)
  })
}
