import { useCallback, useMemo, useRef, useState } from 'react'
import { buildVfs, formatPath } from '../lib/vfs'
import { complete, execute, type ShellContext } from '../lib/commands'
import { track } from '../lib/analytics'
import type { TerminalHistoryItem } from '../types'
import { usePublicContent } from './useLocale'
import { publicCopy } from '../data/public-copy'

const WELCOME: TerminalHistoryItem = {
  id: 0,
  cwd: '~',
  command: 'neofetch --short',
  result: {
    status: 'info',
    lines: [
      [{ kind: 'text', text: publicCopy.terminalWelcome, tone: 'accent' }],
      [
        { kind: 'text', text: publicCopy.terminalHint },
        { kind: 'command', text: 'help', command: 'help' },
        { kind: 'text', text: ' ' },
        { kind: 'command', text: 'ls -l', command: 'ls -l' },
        { kind: 'text', text: ' ' },
        { kind: 'command', text: 'whoami --stats', command: 'whoami --stats' },
        { kind: 'text', text: ' ' },
        { kind: 'command', text: 'tail -f experience.log', command: 'tail -f experience.log' },
      ],
    ],
  },
}

export function useTerminal() {
  const content = usePublicContent()
  const root = useMemo(() => buildVfs(content), [content])
  const [cwd, setCwd] = useState<string[]>([])
  const [items, setItems] = useState<TerminalHistoryItem[]>([WELCOME])
  const [commands, setCommands] = useState<string[]>([])
  const [input, setInput] = useState('')
  const cursor = useRef<number | null>(null)
  const nextId = useRef(1)

  const ctx = useCallback(
    (): ShellContext => ({ root, cwd, history: commands, setCwd, clear: () => setItems([]), content }),
    [root, cwd, commands, content],
  )

  const run = useCallback(
    (raw: string) => {
      const command = raw.trim()
      cursor.current = null
      setInput('')
      if (!command) {
        setItems((prev) => [...prev, { id: nextId.current++, cwd: formatPath(cwd), command: '', result: { status: 'success', lines: [] } }])
        return
      }
      const history = [...commands, command]
      setCommands(history)
      let cleared = false
      const result = execute(command, { ...ctx(), history, clear: () => (cleared = true) })
      track('terminal_command', command.split(' ')[0])
      if (cleared) setItems([])
      else setItems((prev) => [...prev, { id: nextId.current++, cwd: formatPath(cwd), command, result }])
    },
    [commands, ctx, cwd],
  )

  const historyUp = useCallback(() => {
    if (!commands.length) return
    const i = cursor.current === null ? commands.length - 1 : Math.max(0, cursor.current - 1)
    cursor.current = i
    setInput(commands[i])
  }, [commands])

  const historyDown = useCallback(() => {
    if (cursor.current === null) return
    const i = cursor.current + 1
    if (i >= commands.length) {
      cursor.current = null
      setInput('')
    } else {
      cursor.current = i
      setInput(commands[i])
    }
  }, [commands])

  const tab = useCallback(() => setInput((v) => complete(v, ctx())), [ctx])

  return { items, input, setInput, run, historyUp, historyDown, tab, clear: () => setItems([]), cwd: formatPath(cwd) }
}
