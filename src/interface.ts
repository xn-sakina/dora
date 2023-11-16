export interface IDoraDep {
  name: string
  /**
   * hook precompile lifecycle
   */
  hooks?: Partial<IDoraDepHooks>
}

export interface IHookContext {
  source: string
  targetDir: string
  taskName: string
  options: IDoraEsmToCjsOptions
}
export interface ITaskrTaskParams {
  task: any
  opts: any
}
export interface IHookNccOptions {
  packageName: string
  externals: Record<string, string>
  [key: string]: any
}

export interface IHookAddTaskBefore extends IHookContext {}
export interface IHookRunTaskBefore extends IHookContext {
  externals: Record<string, string>
  taskr: ITaskrTaskParams
  nccOptions: IHookNccOptions
}

export type IDoraHookReturn = void | Promise<void>

export interface IDoraDepHooks {
  onAddTaskBefore(opts: IHookAddTaskBefore): IDoraHookReturn
  onRunTaskBefore(opts: IHookRunTaskBefore): void
}

export interface IDoraTaskrHookContext {
  tasks: string[]
  es: Record<string, any>
  packages: string[]
  options: IDoraCreateTaskfileOptions
}
export interface IDoraTaskrHooks {
  onTasksAddBefore(opts: IDoraTaskrHookContext): IDoraHookReturn
}

export interface IDoraConfig {
  /**
   * from esm to cjs deps
   */
  deps?: Array<IDoraDep | string>
  declaration?: {
    /**
     * generate package name prefixes for dep declaration
     */
    prefix?: string
  }
  taskr?: {
    /**
     * taskr hooks
     */
    hooks?: Partial<IDoraTaskrHooks>
  }
  externals?: {
    /**
     * extra externals
     */
    extra?: string[]
  }
  // TODO: hook taskr
  // TODO: hook ncc plugin
}

export interface IOptions extends IArgv {
  cwd: string
}

export interface IArgv {
  dep?: string
  [key: string]: any
}

export interface IPrecompileOptions extends IOptions {}

export interface IDoraEsmToCjsOptions {
  packageName: string
  basedir: string
  es: Record<string, any>
  externals?: string[]
  overrideSource?: string
  hooks?: IDoraDep['hooks']
}

export interface IDoraCreateTaskfileOptions {
  cwd: string
  config: IDoraConfig
  argv: IArgv
}
