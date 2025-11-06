const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.js',
    output: {
      filename: 'content-script.bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              manifest.version = packageJson.version;
              return JSON.stringify(manifest, null, 2);
            }
          }
        ]
      })
    ],
    resolve: {
      extensions: ['.js']
    },
    optimization: {
      minimize: isProduction
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map'
  };
};
