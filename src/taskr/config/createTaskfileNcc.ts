import { resolveDep } from '../utils'
// @ts-expect-error
import ncc from '@vercel/ncc'
import findUp from 'find-up'
import { existsSync, readFileSync } from 'fs'
import { Module } from 'module'
import { basename, dirname, extname, join, resolve } from 'path'

function writePackageManifest(opts: {
  packageName: string
  main: any
  basedir: string
  bundleRequire: typeof require
  bundleName?: string
}) {
  const { packageName, main, bundleName, basedir, bundleRequire } = opts
  let packagePath: string | undefined

  try {
    packagePath = bundleRequire.resolve(`${packageName}/package.json`, {
      paths: [basedir],
    })
  } catch {
    try {
      packagePath = resolveDep(`${packageName}/package.json`, basedir)
      if (!packagePath) {
        throw new Error('not found')
      }
    } catch {
      packagePath = findUp.sync('package.json', {
        cwd: dirname(bundleRequire.resolve(packageName, { paths: [basedir] })),
      })
    }
  }

  const pkgPath = packagePath!
  const { name, author, license, version } = require(pkgPath)

  const compiledPackagePath = join(
    basedir,
    `compiled/${bundleName || packageName}`
  )

  const potentialLicensePath = join(dirname(pkgPath), './LICENSE')
  if (existsSync(potentialLicensePath)) {
    // @ts-expect-error
    this._.files.push({
      dir: compiledPackagePath,
      base: 'LICENSE',
      data: readFileSync(potentialLicensePath, 'utf8'),
    })
  } else {
    // license might be lower case and not able to be found on case-sensitive
    // file systems (ubuntu)
    const otherPotentialLicensePath = join(dirname(pkgPath), './license')
    if (existsSync(otherPotentialLicensePath)) {
      // @ts-expect-error
      this._.files.push({
        dir: compiledPackagePath,
        base: 'LICENSE',
        data: readFileSync(otherPotentialLicensePath, 'utf8'),
      })
    }
  }

  // @ts-expect-error
  this._.files.push({
    dir: compiledPackagePath,
    base: 'package.json',
    data: `${JSON.stringify(
      Object.assign(
        {},
        { name, main: basename(main, `.${extname(main)}`) },
        version ? { version } : undefined,
        author ? { author } : undefined,
        license ? { license } : undefined
      )
    )}\n`,
  })
}

export const createTaskfileNcc = async (opts: {
  cwd: string
  declarationPrefix?: string
}) => {
  const { cwd, declarationPrefix } = opts

  const m = new Module(resolve(cwd, 'bundles', '_'))
  m.filename = m.id
  // @ts-expect-error
  m.paths = Module._nodeModulePaths(m.id)
  const bundleRequire = m.require
  // @ts-expect-error
  bundleRequire.resolve = (request, options) => {
    // @ts-expect-error
    return Module._resolveFilename(request, m, false, options)
  }

  // exports
  const es = function (task: any, _utils: any) {
    task.plugin('ncc', {}, function* (file: any, options: any) {
      if (options.externals && options.packageName) {
        options.externals = { ...options.externals }
        delete options.externals[options.packageName]
      }

      return ncc(join(cwd, file.dir, file.base), {
        filename: file.base,
        minify: options.minify !== false,
        assetBuilds: true,
        esm: false,
        target: 'es2019',
        ...options,
      }).then(({ code, assets }: any) => {
        Object.keys(assets).forEach((key) => {
          const data = assets[key].source

          // @ts-expect-error
          this._.files.push({
            data,
            base: basename(key),
            dir: join(file.dir, dirname(key)),
          })
        })

        if (options && options.packageName) {
          writePackageManifest.call(
            // @ts-expect-error
            this,
            {
              packageName: options.packageName,
              main: file.base,
              bundleName: options.bundleName,
              basedir: cwd,
              bundleRequire,
            }
          )
        }

        file.data = Buffer.from(code, 'utf8')
      })
    })

    task.plugin('dts', {}, function* (file: any, options: any) {
      const code = options.packages
        .map(
          (packageName: any) =>
            `declare module '${declarationPrefix}/compiled/${packageName}' {\n  import * as p from '${packageName}';\n  export = p;\n}\n`
        )
        .join('\n')
      return Promise.resolve().then(() => {
        file.data = Buffer.from(code, 'utf8')
      })
    })
  }

  return es
}
