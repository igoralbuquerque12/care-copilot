import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Gera um servidor autocontido, apropriado para a imagem de produção.
  output: "standalone",
};

export default config;
