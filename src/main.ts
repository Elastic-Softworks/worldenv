// src/main.ts

import { Game } from './core/Game';

async function main() {

      const game = new Game({

            width: 800,
            height: 600,
            canvasId: 'gameCanvas',

      });

      await game.init();
      game.run();

}
