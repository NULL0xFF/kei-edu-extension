const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Read the version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

module.exports = {
  mode: 'production',
  entry: './src/contentScript.js',
  output: {
    filename: 'contentScript.bundle.js',
    path: path.resolve(__dirname, 'dist')
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
          }
        },
        {
          from: 'LICENSE.md',
          to: 'LICENSE.md'
        }
      ]
    })
  ],
  optimization: {
    minimize: false,
    mangleExports: false
  }
};