import resolve from '@rollup/plugin-node-resolve'
import multi from '@rollup/plugin-multi-entry'
import babel from 'rollup-plugin-babel'

const popupConfig = {
  input: 'src/popup.js',
  output: {
    file: 'dist/popup.js',
    format: 'umd'
  }
}

const contentConfig = {
  input: 'src/content.js',
  output: {
    file: 'dist/content.js',
    format: 'umd'
  }
}

const commonConfig = {
  plugins: [
    resolve(),
    multi(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
}

export default [
  Object.assign({}, popupConfig, commonConfig),
  Object.assign({}, contentConfig, commonConfig)
]
