import type { IArgv, IDoraConfig } from '../interface'

export interface IPkg {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  [key: string]: any
}

export interface IBase {
  cwd: string
  argv: IArgv
  pkg: IPkg
  pkgPath: string
  config: IDoraConfig
}

export interface IContext extends IBase {}

export interface ITaskrInstanceOptions {
  cwd: string
  plugins: any[]
  tasks: any
  file?: string
}
