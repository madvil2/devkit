export default {
  plugins: {
    '@csstools/postcss-global-data': {
      files: ['src/shared/styles/tokens/media.css'],
    },
    'postcss-custom-media': {},
  },
}
