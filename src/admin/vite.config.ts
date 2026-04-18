import { mergeConfig, type UserConfig } from 'vite';
import { resolve } from 'path';

export default (config: UserConfig) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    resolve: {
      alias: {
        'zod/v4': resolve('node_modules/zod/v4/index.js'),
      },
    },
    optimizeDeps: {
      include: ['zod/v4'],
    },
  });
};
