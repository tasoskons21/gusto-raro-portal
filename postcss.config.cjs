module.exports = {
  plugins: {
    'postcss-preset-env': {
      stage: 0,
      features: {
        'oklch-color-function': false,
        'color-function': false,
        'lab-function': false,
        'lch-function': false
      }
    },
    'autoprefixer': {}
  }
}
