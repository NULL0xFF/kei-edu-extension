// webpack.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    'scripts/course': './src/scripts/course.js',
    'scripts/dashboard': './src/scripts/dashboard.js',
    'scripts/member': './src/scripts/member.js',
    'scripts/shared': './src/scripts/shared.js',
    'scripts/solution': './src/scripts/solution.js',
    'scripts/storage': './src/scripts/storage.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // Clean the output directory before emit
  },
  optimization: {
    minimize: true, // Enable code minification for production
    splitChunks: {
      chunks: 'all', // Enable code splitting
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-transform-runtime', // Optional, for async/await
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{from: 'manifest.json', to: 'manifest.json'}],
    }),
  ],
  mode: 'production',
};
