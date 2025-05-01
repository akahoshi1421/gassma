const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
  entry: "./src/gassma.ts",
  mode: "development",
  devtool: false,

  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },

  resolve: {
    modules: [path.resolve("./src"), "node_modules"],
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
