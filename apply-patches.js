import fs from "fs";
import path from "path";

const patchesDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "patches"
);
const nodeModulesDir = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "node_modules"
);

function applyPatches(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      applyPatches(filePath);
    } else {
      const relativePath = path.relative(patchesDir, filePath);
      const targetPath = path.join(nodeModulesDir, relativePath);

      if (fs.existsSync(targetPath)) {
        fs.copyFileSync(filePath, targetPath);
        console.log(`Applied patch: ${relativePath}`);
      }
    }
  });
}

applyPatches(patchesDir);
