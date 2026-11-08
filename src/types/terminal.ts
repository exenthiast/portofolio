export interface CommandResult {
  stdout: string[]
  status: 'success' | 'error' | 'info'
}

export interface TerminalHistoryItem {
  id: string
  command: string
  result?: CommandResult
}

export interface VFSNode {
  name: string
  type: 'file' | 'dir'
  content?: string
  children?: Record<string, VFSNode>
  permissions?: string
}
