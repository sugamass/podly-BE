const path = require("path");

module.exports = {
  mode: "development",
  target: "node",
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
    filename: "[name].js",
  },
  externals: {
    "aws-sdk": "aws-sdk",
  },
};
