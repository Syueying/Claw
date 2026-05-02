'use strict'

// Webpack config for building the GitHub Pages website (landing + plans pages only).
// Output: docs/ — committed to main branch and served by GitHub Pages.
// Run: npm run build:web

const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const fileExtensions = [
  "jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2",
];

const config = {
  mode: "production",
  entry: {
    landing: path.join(__dirname, "src", "pages", "Landing", "index.tsx"),
    plans: path.join(__dirname, "src", "pages", "Plans", "index.tsx"),
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "docs"),
    clean: true,
    // Relative public path works in both root domains and subdirectory paths.
    publicPath: "./",
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "sass-loader", options: { sourceMap: false } },
        ],
      },
      {
        test: new RegExp(`.(${fileExtensions.join("|")})$`),
        type: "asset/resource",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: { transpileOnly: true },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets/",
          to: path.join(__dirname, "docs/assets"),
          force: true,
        },
        {
          from: "src/_locales/",
          to: path.join(__dirname, "docs/_locales"),
          force: true,
        },
      ],
    }),
    // Landing page is the index
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages", "Landing", "landing.html"),
      filename: "index.html",
      chunks: ["landing"],
      favicon: path.join(__dirname, "src", "assets", "favicon.png"),
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages", "Landing", "landing.html"),
      filename: "landing.html",
      chunks: ["landing"],
      favicon: path.join(__dirname, "src", "assets", "favicon.png"),
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages", "Plans", "plans.html"),
      filename: "plans.html",
      chunks: ["plans"],
      favicon: path.join(__dirname, "src", "assets", "favicon.png"),
      cache: false,
    }),
  ],
  resolve: {
    extensions: [".js", ".tsx", ".jsx", ".ts", ".json"],
  },
};

module.exports = config;
