import { defineConfig } from '@xn-sakina/dora'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  deps: [
    'chalk',
    {
      name: 'satori',
    },
    {
      name: 'terser',
    },
    {
      name: 'sass-loader',
      hooks: {
        onRunTaskBefore(opts) {
          const sassLoaderPath = require.resolve('sass-loader')
          const utilsPath = path.join(path.dirname(sassLoaderPath), 'utils.js')
          const originalContent = fs.readFileSync(utilsPath, 'utf-8')

          fs.writeFileSync(
            utilsPath,
            originalContent.replace(
              /require\.resolve\(["'](sass|node-sass)["']\)/g,
              'eval("require").resolve("$1")'
            ),
            'utf-8'
          )

          opts.externals = {
            ...opts.externals,
            'node-sass': 'node-sass',
            sass: 'sass',
            fibers: 'fibers',
          }
          console.log('opts: ', opts)
        },
      },
    },
  ],
})
