const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    mode: 'development',

    context: path.resolve(__dirname),

    entry: './src/index.tsx',

    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist'),
        publicPath: '/'
    },

    devServer: {
        port: 8080,
        compress: true,
        hot: true,
        historyApiFallback: true,
        contentBase: path.join(__dirname, 'dist'),
        publicPath: '/'
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: 'inline-source-map',

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['.ts', '.tsx', '.js', '.json'],
        modules: ['node_modules']
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'babel-loader',
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ],
                exclude: [/node_modules/]
            },
            {
                test: /\.global\.css$/,
                use: [
                  {
                    loader: 'style-loader',
                  },
                  {
                    loader: 'css-loader',
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      ident: 'postcss',
                      plugins: [require('tailwindcss'), require('autoprefixer')],
                    },
                  },
                ],
            },
            {
                test: /^((?!\.global).)*\.css$/,
                use: [
                  {
                    loader: 'style-loader',
                  },
                  {
                    loader: 'css-loader',
                    options: {
                      modules: {
                        localIdentName: '[name]__[local]__[hash:base64:5]',
                      },
                      sourceMap: true,
                      importLoaders: 1,
                    },
                  },
                ],
              },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            }
        ]
    },
    node: {
        fs: 'empty'
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            title: 'Zoomer',
            template: 'src/index.html'
      })
    ]
};