import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jpeg from 'jpeg-js';
import UTIF from 'utif';

async function findTiffs(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'generated') continue;
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) files.push(...(await findTiffs(filePath)));
    else if (entry.isFile() && /\.tiff?$/i.test(entry.name)) files.push(filePath);
  }

  return files;
}

async function removeStale(directory, expected) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeStale(entryPath, expected);
      if ((await readdir(entryPath)).length === 0) await rm(entryPath, { recursive: true });
    } else if (!expected.has(entryPath)) {
      await rm(entryPath);
    }
  }
}

export async function convertTiffs(contentDir) {
  const outputDir = path.join(contentDir, 'generated', 'tiff');
  const files = await findTiffs(contentDir);
  if (files.length === 0) {
    await rm(outputDir, { recursive: true, force: true });
    return;
  }

  await mkdir(outputDir, { recursive: true });
  const outputs = files.map((filePath) =>
    path.join(outputDir, `${path.relative(contentDir, filePath)}.jpg`),
  );
  await removeStale(outputDir, new Set(outputs));

  for (const [index, filePath] of files.entries()) {
    const outputPath = outputs[index];

    try {
      const sourceTime = (await stat(filePath)).mtimeMs;
      const outputTime = await stat(outputPath).then(
        (result) => result.mtimeMs,
        (error) => {
          if (error.code === 'ENOENT') return 0;
          throw error;
        },
      );
      if (outputTime >= sourceTime) continue;
      const source = await readFile(filePath);
      const ifd = UTIF.decode(source)[0];
      if (!ifd) throw new Error('No image found in TIFF');
      UTIF.decodeImage(source, ifd);
      if (!ifd.width || !ifd.height) throw new Error('Invalid TIFF dimensions');
      const data = Buffer.from(UTIF.toRGBA8(ifd));
      if (data.length !== ifd.width * ifd.height * 4) throw new Error('Invalid TIFF pixels');
      const jpegData = jpeg.encode({ data, width: ifd.width, height: ifd.height }, 75).data;
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, jpegData);
      console.log(
        `Converted ${path.relative(contentDir, filePath)} -> ${path.relative(contentDir, outputPath)}`,
      );
    } catch (error) {
      await rm(outputPath, { force: true });
      console.warn(`Could not convert ${path.relative(contentDir, filePath)}: ${error}`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await convertTiffs(path.resolve('content'));
}
