/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LaunchProcessOptions } from '../../utils';
import type * as types from '../types';

export function getFromENV(name: string): string | undefined {
  let value = process.env[name];
  value = value === undefined ? process.env[`npm_config_${name.toLowerCase()}`] : value;
  value = value === undefined ?  process.env[`npm_package_config_${name.toLowerCase()}`] : value;
  return value;
}

export function getAsBooleanFromENV(name: string, defaultValue?: boolean | undefined): boolean {
  const value = getFromENV(name);
  if (value === 'false' || value === '0')
    return false;
  if (value)
    return true;
  return !!defaultValue;
}

export function getPackageManager() {
  const env = process.env.npm_config_user_agent || '';
  if (env.includes('yarn'))
    return 'yarn';
  if (env.includes('pnpm'))
    return 'pnpm';
  return 'npm';
}

export function getPackageManagerExecCommand() {
  const packageManager = getPackageManager();
  if (packageManager === 'yarn')
    return 'yarn';
  if (packageManager === 'pnpm')
    return 'pnpm exec';
  return 'npx';
}

export function isLikelyNpxGlobal() {
  return process.argv.length >= 2 && process.argv[1].includes('_npx');
}

// Indicate that this and child processes are running under Playwright Test.
export function setPlaywrightTestProcessEnv() {
  return process.env['PLAYWRIGHT_TEST'] = '1';
}

export function userDataDirOverride(options: LaunchProcessOptions | types.LaunchOptions, profileName: string): string | undefined {
  // --- BEGIN override Firefox profile directory via env ---
  let override: string | undefined;

  try {
    // 1) Достаём PW_OVERRIDE_FF_PROFILE из options.env (любой формы) или из process.env
    const ev = options.env;

    if (Array.isArray(ev)) {
      // формат: [{ name: 'FOO', value: 'bar' }, ...]
      const entry = ev.find(e => e && e.name === profileName);
      if (entry && entry.value)
        override = entry.value;
    } else if (ev && typeof ev === 'object') {
      // формат: { FOO: 'bar', ... }
      const value = ev[profileName];
      override = typeof value === 'string' ? value : undefined;
    }

    if (!override && typeof process !== 'undefined' && process.env)
      override = process.env[profileName];

    // 2) Если есть override — подменяем путь после флага профиля
    if (override) {
      const args = options.args || (options.args = []);
      const idx = args.findIndex(a => a === '-profile' || a === '--profile' || a === '-P');
      if (idx !== -1 && idx + 1 < args.length)
        args[idx + 1] = override; // никакие кавычки не нужны: аргументы уже раздельные
    }
  } catch (e) {
    // no-op
  }

  return override;
  // --- END override Firefox profile directory via env ---
}
