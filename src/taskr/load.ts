import type { IContext, IPkg } from './interface'
import { resolveDepFromCurrentPkg, resolveDep } from './utils'
import { dirname } from 'path'

const rgx = /^@(taskr|fly)|(taskr|fly)-/i

const EXCLUDE_TASKR_DEPS = ['@taskr/esnext', '@taskr/clear']
const TASKS_INTERNAL_DEPS = {
  clear: resolveDepFromCurrentPkg('@taskr/clear'),
}

const getPluginsFromDep = (opts: { pkg: IPkg; pkgPath: string }) => {
  const { pkg, pkgPath } = opts
  const deps = {
    ...pkg?.dependencies,
    ...pkg?.devDependencies,
  }
  const depsEntryList = Object.keys(deps)
    .filter((dep) => {
      const isExcluded = EXCLUDE_TASKR_DEPS.includes(dep)
      return rgx.test(dep) && !isExcluded
    })
    .map((dep) => {
      return resolveDep(dep, dirname(pkgPath))
    })
    .filter(Boolean) as string[]
  return [...depsEntryList, TASKS_INTERNAL_DEPS.clear] as string[]
}

const getPluginsFromLocal = (opts: { pkg: IPkg; pkgPath: string }) => {
  const { pkg, pkgPath } = opts
  const locals: string[] = pkg?.taskr?.requires || []
  const plugins = locals
    .map((local) => {
      return resolveDep(local, dirname(pkgPath))
    })
    .filter(Boolean) as string[]
  return plugins
}

// lib/plugins.js > load
export const load = async (opts: IContext) => {
  const { pkg, pkgPath } = opts

  const pluginsFromDep = getPluginsFromDep({ pkg, pkgPath })
  const pluginsFromLocal = getPluginsFromLocal({ pkg, pkgPath })

  return [...pluginsFromDep, ...pluginsFromLocal].map((file) => require(file))
}
