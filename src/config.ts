import { loadConfig } from 'c12'

export const readConfig = async (opts: { cwd: string }) => {
  const { cwd } = opts
  const config = await loadConfig({
    name: 'dora',
    cwd,
  })
  return config
}
