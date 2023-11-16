import { readConfig } from './config'
import type { IOptions, IPrecompileOptions } from './interface'
import { cli } from './taskr/cli'
import { IContext } from './taskr/interface'
import chalk from 'chalk'
import { program } from 'commander'
import { join } from 'path'

export const main = async () => {
  const pkgPath = join(__dirname, '../package.json')
  const pkg = require(pkgPath)

  const cwd = process.cwd()

  program
    .command('build')
    .option('-c, --cwd <cwd>', 'cwd', cwd)
    .option('-d, --dep <dep>', 'build only one dep')
    .allowUnknownOption(true)
    .description(
      `Build some deps from ${chalk.bold.blue('esm')} to ${chalk.bold.green(
        'cjs'
      )}`
    )
    .action(async (options: IOptions) => {
      await precompile(options)
    })

  program.name('dora').description('precompile utils').version(pkg.version)
  program.parse(process.argv)
}

async function precompile(opts: IPrecompileOptions) {
  const { cwd, ...argv } = opts
  const parsedConfig = await readConfig({ cwd })
  const pkgPath = join(cwd, 'package.json')
  const pkg = require(pkgPath)

  const context: IContext = {
    pkgPath,
    pkg,
    cwd,
    argv,
    config: parsedConfig?.config || {},
  }

  await cli(context)
}
