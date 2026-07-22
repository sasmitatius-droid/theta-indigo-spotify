#!/usr/bin/env ts-node
/**
 * upload-cover.ts
 * One-time setup script to upload the podcast cover art to R2.
 * Run once: npm run setup:cover
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
else dotenv.config();

import { uploadCoverArt, R2_PUBLIC_URL } from '../src/r2-client';

async function main() {
  const candidates = [
    path.resolve(__dirname, '../assets/logo-indigo-sp.png'),
    path.resolve(__dirname, '../assets/cover.png'),
    path.resolve(process.cwd(), 'assets/logo-indigo-sp.png'),
  ];

  let imagePath: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { imagePath = c; break; }
  }

  if (!imagePath) {
    console.error('❌ No cover art found in assets/. Looked for: logo-indigo-sp.png, cover.png');
    process.exit(1);
  }

  console.log(`📁 Reading cover art from: ${imagePath}`);
  const buffer = fs.readFileSync(imagePath);
  const url    = await uploadCoverArt(buffer);

  console.log('✅ Cover art uploaded successfully!');
  console.log(`🔗 Public URL: ${url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
