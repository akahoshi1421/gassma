const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  mode: "development",
  devtool: false,

  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: path.resolve("./src/__test__"),
        loader: "ts-loader",
      },
    ],
  },

  plugins: [
    new GasPlugin({
      autoGlobalExportsFiles: ["**/*.ts"],
    }),
  ],
};
