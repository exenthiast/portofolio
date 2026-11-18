/** A run of terminal output. `command` segments render as clickable pills. */
export type OutputSegment =
  | { kind: 'text'; text: string; tone?: 'default' | 'muted' | 'accent' | 'error' }
  | { kind: 'command'; text: string; command: string }
  | { kind: 'link'; text: string; href: string }

export type OutputLine = OutputSegment[]

export interface CommandResult {
  lines: OutputLine[]
  status: 'success' | 'error' | 'info'
}

export interface TerminalHistoryItem {
  id: number
  cwd: string
  command: string
  result: CommandResult
}

export interface VFSFile {
  type: 'file'
  name: string
  content: string
  /** Optional side effect when the file is `open`ed. */
  action?: () => void
}

export interface VFSDir {
  type: 'dir'
  name: string
  children: Record<string, VFSNode>
  action?: () => void
}

export type VFSNode = VFSFile | VFSDir
