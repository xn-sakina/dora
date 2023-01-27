import type { IDoraConfig } from '../interface'
import { join } from 'path'
import { sync } from 'resolve'

export const resolveDepFromCurrentPkg = (dep: string) => {
  try {
    return sync(dep, { basedir: join(__dirname, '../../') })
  } catch {
    return undefined
  }
}

export const resolveDep = (dep: string, cwd: string) => {
  try {
    return sync(dep, { basedir: cwd })
  } catch {
    return undefined
  }
}

export function normalizeDeps(deps: IDoraConfig['deps'] = []) {
  return deps.map((dep) => {
    if (typeof dep === 'string') {
      return {
        name: dep,
      }
    }
    return dep
  })
}
