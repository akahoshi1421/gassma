import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["./src/publicApiGlobals.ts"],
    bundle: true,
    minify: false,
    format: "iife",
    target: "es2019",
    outfile: "./dist/bundle.js",
  })
  .catch((error) => {
    console.error("Build failed.");
    console.error(error);
    process.exit(1);
  });
