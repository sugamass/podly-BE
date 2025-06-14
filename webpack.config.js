const path = require("path");
const serverlessWebpack = require("serverless-webpack");

module.exports = {
  mode: "development",
  target: "node",
  entry: serverlessWebpack.lib.entries,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  externals: {
    "aws-sdk": "aws-sdk",
  },
};
