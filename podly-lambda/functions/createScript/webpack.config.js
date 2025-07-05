const path = require("path");

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
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
  },
  externals: {
    "aws-sdk": "aws-sdk",
  },
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
  },
  stats: "minimal",
};
