const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@shared": path.resolve(__dirname, "../../shared/src"),
      "@podly/shared": path.resolve(__dirname, "../../shared/src/index.ts"),
    },
    fallback: {
      canvas: false,
      bufferutil: false,
      "utf-8-validate": false,
    },
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
  },
  externals: {
    "aws-sdk": "aws-sdk",
    canvas: "canvas",
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
    undici: "undici",
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^(canvas|bufferutil|utf-8-validate|undici)$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^(fsevents)$/,
    }),
  ],
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
  },
  stats: "minimal",
};
