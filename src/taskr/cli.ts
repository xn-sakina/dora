import type { IContext } from './interface'
import { spawn } from './spawn'
// @ts-expect-error
import reporter from 'taskr/lib/reporter'

const mode = 'serial'
const runTasks = ['ncc']

export const cli = async (opts: IContext) => {
  const taskr = await spawn(opts)

  reporter.call(taskr)

  await taskr[mode](runTasks)
}
