const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Read the version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'content-script.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Parse the manifest file content
            const manifestJson = JSON.parse(content.toString());
            // Update the version
            manifestJson.version = packageJson.version;
            // Return the updated manifest content
            return JSON.stringify(manifestJson, null, 2);
          },
        },
        {
          from: 'LICENSE.md',
          to: 'LICENSE.md',
        },
        {
          from: 'README.md',
          to: 'README.md',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  optimization: {
    minimize: true,
  },
  devtool: 'source-map',
};