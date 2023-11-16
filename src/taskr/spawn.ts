import { createTaskfile } from './config/createTaskfile'
import { createTaskfileNcc } from './config/createTaskfileNcc'
import type { IContext, ITaskrInstanceOptions } from './interface'
import { load } from './load'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
// @ts-expect-error
import Taskr from 'taskr/lib/taskr'

// lib/spawn.js > default
export const spawn = async (opts: IContext) => {
  const { cwd, config, pkg, argv } = opts
  const plugins = await load(opts)

  const nccPlugin = await createTaskfileNcc({
    cwd,
    declarationPrefix: config?.declaration?.prefix || pkg?.name || '@',
  })

  const tasks = await createTaskfile({
    cwd,
    config,
    argv,
  })

  // ensure compiled.d.ts exists
  const typesDir = join(cwd, 'types')
  const compiledTypeFile = join(typesDir, 'compiled.d.ts')
  if (!existsSync(compiledTypeFile)) {
    if (!existsSync(typesDir)) {
      mkdirSync(typesDir)
    }
    writeFileSync(compiledTypeFile, '\n', 'utf-8')
  }

  const instanceOptions: ITaskrInstanceOptions = {
    cwd,
    plugins: [...plugins, nccPlugin],
    tasks,
    // file: join(__dirname, './config/empty.js'),
  }

  return new Taskr(instanceOptions)
}
