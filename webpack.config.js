const path = require("path"),
	webpack = require("webpack");

var screw_ie8 = false; // Same name as uglify's IE8 option. Turn this on to enable HMR.

var plugins = [];

// HMR doesn't work with IE8 
if (screw_ie8) {
	plugins.push(new webpack.HotModuleReplacementPlugin());
}

plugins.push(new webpack.optimize.UglifyJsPlugin({
	mangleProperties: {
    	screw_ie8: false,
	},
	compress: {
		screw_ie8: false
	},
	output: {
		screw_ie8: false
	}
}));

module.exports = {
	entry: [ "./src/app.js" ],
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
		publicPath: "/dist/"
	},
	plugins: plugins,
	module: {
		rules: [
			{
				test: /\.js$/,
				include: [
					path.resolve(__dirname, "src")
				],
				use: {
					loader: "babel-loader"
				}
			},
			{
				test: /\.js$/,
				enforce: "post",
				loader: "es3ify-loader"
			}
		]
	},
	resolve: {
		alias:{
			zerosense: path.resolve( __dirname, 'src', 'zerosense')
		},
		extensions: [ '.js' ]
  }
};