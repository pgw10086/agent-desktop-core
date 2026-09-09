import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { DesktopSurfaceManager } from '../lib/desktop-surface-manager.js'

test('transient Surface 关闭后恢复外部焦点，blur 事件不会递归关闭', async () => {
  const quick = new FakeWindow()
  let restoreCalls = 0
  let disposeCalls = 0
  let captureCalls = 0
  const manager = new DesktopSurfaceManager({
    createWindow: () => quick,
    focusPort: {
      capture: () => {
        captureCalls += 1
        return {
          restore: async () => { restoreCalls += 1; return { status: 'restored' } },
          dispose: () => { disposeCalls += 1 },
        }
      },
    },
  })
  manager.register(
    {
      id: 'clipboard.quick',
      kind: 'clipboard.quick-retrieval',
      content: { type: 'plugin-view', viewId: 'clipboard.quick' },
      window: { focus: 'activate', dismiss: 'restore-previous' },
    },
    { window: { show: false }, load: async () => undefined, hideOnBlur: true },
  )

  await manager.open('clipboard.quick')
  await Promise.all([manager.close('clipboard.quick'), manager.close('clipboard.quick')])

  assert.equal(captureCalls, 1)
  assert.equal(restoreCalls, 1)
  assert.equal(disposeCalls, 1)
  assert.equal(quick.visible, false)
})

test('显式 external-handoff 只关闭 Surface，不恢复旧焦点', async () => {
  const quick = new FakeWindow()
  let restored = 0
  let disposed = 0
  const manager = new DesktopSurfaceManager({
    createWindow: () => quick,
    focusPort: {
      capture: () => ({
        restore: async () => { restored += 1; return { status: 'restored' } },
        dispose: () => { disposed += 1 },
      }),
    },
  })
  manager.register(
    {
      id: 'conversation.quick',
      kind: 'conversation.quick',
      content: { type: 'runtime-view', runtimeId: 'dsh' },
      window: { focus: 'activate', dismiss: 'restore-previous' },
    },
    { window: { show: false }, load: async () => undefined },
  )

  await manager.open('conversation.quick')
  await manager.close('conversation.quick', { disposition: 'external-handoff' })

  assert.equal(restored, 0)
  assert.equal(disposed, 1)
})

test('同一产品进程内已有窗口优先于平台适配器恢复', async () => {
  const quick = new FakeWindow()
  const main = new FakeWindow()
  let platformCaptureCalls = 0
  const manager = new DesktopSurfaceManager({
    createWindow: () => quick,
    getFocusedWindow: () => main,
    focusPort: { capture: () => { platformCaptureCalls += 1; return undefined } },
  })
  manager.register(
    {
      id: 'conversation.quick',
      kind: 'conversation.quick',
      content: { type: 'runtime-view', runtimeId: 'dsh' },
      window: { focus: 'activate', dismiss: 'restore-previous' },
    },
    { window: { show: false }, load: async () => undefined },
  )

  await manager.open('conversation.quick')
  await manager.close('conversation.quick')

  assert.equal(platformCaptureCalls, 0)
  assert.equal(main.focusCalls, 1)
})

class FakeWindow extends EventEmitter {
  visible = false
  destroyed = false
  focusCalls = 0

  show() { this.visible = true; this.emit('show') }
  hide() { this.visible = false; this.emit('blur'); this.emit('hide') }
  focus() { this.focusCalls += 1; this.emit('focus') }
  destroy() { this.destroyed = true; this.emit('closed') }
  isDestroyed() { return this.destroyed }
  setAlwaysOnTop() {}
  setBounds() {}
  setSize() {}
  setPosition() {}
  getBounds() { return { x: 0, y: 0, width: 480, height: 400 } }
}
