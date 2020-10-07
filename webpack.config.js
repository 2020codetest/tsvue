module.exports = {
    entry: {
        main: "./src/main.tsx"
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"]
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader"
                }
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "style-loader",
                        options: {
                            injectType: "singletonStyleTag"
                        }
                    },
                    "css-loader",
                ]
            }
        ]
    },
    mode: "development",
    devtool: "source-map"
}