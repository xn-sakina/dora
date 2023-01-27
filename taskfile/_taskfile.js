const path = require('path')
const { sync } = require('resolve')

const packages = []
const basedir = path.resolve(__dirname)
const fromEsmToCjs = (packageName, overrideSource = null) => {
  const taskName = `ncc_${packageName
    .replaceAll('@', '__')
    .replaceAll('-', '_')
    .replaceAll('/', '_')}`

  const source =
    overrideSource || path.relative(__dirname, sync(packageName, { basedir }))
  const targetDir = `compiled/${packageName}`
  packages.push(packageName)

  module.exports[taskName] = async function build(task, _opts) {
    const externals = packages.reduce((prev, currentPackageName) => {
      if (currentPackageName !== packageName) {
        prev[currentPackageName] = path.relative(
          path.join(__dirname, targetDir),
          path.join(__dirname, `compiled/${currentPackageName}`)
        )
      }
      return prev
    }, {})

    task.$.log(`source: ${source}`)

    await task.source(source).ncc({ packageName, externals }).target(targetDir)
  }
  return taskName
}

const tasks = [fromEsmToCjs('chalk')]

module.exports.write_compiled_ts_declaration =
  async function write_compiled_ts_declaration(task, _opts) {
    await task.source('types/compiled.d.ts').dts({ packages }).target('types')
  }
async function ncc(task, opts) {
  await task.clear('compiled').parallel(tasks, opts)
  await task.start('write_compiled_ts_declaration')
}
module.exports.ncc = ncc
