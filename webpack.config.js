const path = require("path")

module.exports = {
  mode: "production",
  entry: {
    ["global"]: "./src/index.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: "[name]",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(glb|hdr)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      }
    ],
  },
  performance: {
    maxEntrypointSize: 1024000,
    maxAssetSize: 1024000
  },
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three'),
      //'@barba': path.resolve(__dirname, 'node_modules/@barba/core/dist/barba.mjs'),
    },
  }
};



