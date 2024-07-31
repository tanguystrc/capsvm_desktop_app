const path = require('path');

module.exports = {
  entry: './js/renderer.js', // Point d'entrée pour votre code
  output: {
    path: path.resolve(__dirname, 'js'),
    filename: 'bundle.js', // Nom du fichier de sortie
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  mode: 'development', // ou 'production'
};