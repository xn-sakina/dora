import type {
  IDoraEsmToCjsOptions,
  IDoraTaskrHookContext,
  IHookContext,
  IDoraCreateTaskfileOptions,
  IHookRunTaskBefore,
  IHookNccOptions,
} from '../../interface'
import { normalizeDeps } from '../utils'

const path = require('path')
const { sync } = require('resolve')

export async function fromEsmToCjs(opts: IDoraEsmToCjsOptions) {
  const {
    packageName,
    basedir,
    overrideSource,
    es,
    externals: externalDeps = [],
    hooks,
  } = opts
  const taskName = `ncc_${packageName
    .replaceAll('@', '__')
    .replaceAll('-', '_')
    .replaceAll('/', '_')}`

  const source =
    overrideSource || path.relative(basedir, sync(packageName, { basedir }))
  const targetDir = `compiled/${packageName}`

  const hookContext: IHookContext = {
    source,
    targetDir,
    taskName,
    options: opts,
  }

  await hooks?.onAddTaskBefore?.(hookContext)

  es[taskName] = function* build(task: any, _opts: any) {
    const externals = externalDeps.reduce<Record<string, string>>(
      (prev, currentPackageName) => {
        if (currentPackageName !== packageName) {
          prev[currentPackageName] = path.relative(
            path.join(basedir, targetDir),
            path.join(basedir, `compiled/${currentPackageName}`)
          )
        }
        return prev
      },
      {}
    )

    const nccOptions: IHookNccOptions = { packageName, externals }
    const hookContextForRunTaskBefore: IHookRunTaskBefore = {
      ...hookContext,
      externals,
      taskr: { task, opts: _opts },
      nccOptions,
    }
    hooks?.onRunTaskBefore?.(hookContextForRunTaskBefore)

    task.$.log(`source: ${source}, name: ${packageName}, target: ${targetDir}`)

    task.source(source).ncc(nccOptions).target(targetDir)
  }

  return taskName
}

export async function createTaskfile(opts: IDoraCreateTaskfileOptions) {
  const { cwd, config, argv } = opts

  const _packages = normalizeDeps(
    typeof argv?.dep === 'string' && argv?.dep?.length
      ? [argv.dep]
      : config?.deps || []
  )
  const packages = _packages.map((dep) => dep.name)
  const taskr = config?.taskr

  // exports
  const es: Record<string, any> = {}

  const tasks: string[] = []

  const hookContext: IDoraTaskrHookContext = {
    tasks,
    es,
    packages,
    options: opts,
  }
  await taskr?.hooks?.onTasksAddBefore?.(hookContext)

  const externals = [...packages, ...(config?.externals?.extra || [])]
  for await (const dep of _packages) {
    tasks.push(
      await fromEsmToCjs({
        packageName: dep.name,
        basedir: cwd,
        externals,
        es,
        hooks: dep?.hooks,
      })
    )
  }

  es.ncc = function* ncc(task: any, opts: any) {
    const func = async () => {
      await task.clear('compiled').parallel(tasks, opts)
      // await task.clear('compiled').serial(tasks, opts)
      await task.start('write_compiled_ts_declaration')
    }
    func()
  }
  es.write_compiled_ts_declaration = function* write_compiled_ts_declaration(
    task: any,
    _opts: any
  ) {
    task.source('types/compiled.d.ts').dts({ packages }).target('types')
  }

  return es
}
