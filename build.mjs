import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/main/resources/static/ts/main.ts"],
  bundle: true,
  format: "esm",
  target: "es2020",
  outfile: "src/main/resources/static/js/main.bundle.js",
  sourcemap: true
}).catch(() => process.exit(1));
