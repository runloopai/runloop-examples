# VOIDRUSH
A real-time multiplayer space-snake game, built with Canvas, Node.js, and WebSockets.

## Run
```sh
npm install
npm start
```
Open http://localhost:3000. Share the server URL with friends to play in the same arena. Set `PORT` to change the port. Run `npm test` while the server is running for HTTP and two-client multiplayer smoke tests.

## Play
Move the mouse, drag on touch screens, or use arrow keys / WASD to steer. Hold Space, the mouse button, or the mobile BOOST button to accelerate at the cost of mass. Eat stardust to grow; avoid other snakes' bodies and the map boundary. Fallen rivals turn into food.

The 6,400 × 6,400 arena has 18 bots plus live human players, a leaderboard, minimap, selectable colors, optional synthesized sound, and instant respawns. Game simulation is server-authoritative at 60Hz, with snapshots at 20Hz, frame-rate smoothing of authoritative snake paths and a centered camera. State is in memory and resets on server restart. This is a multiplayer prototype, not a production-scale MMO: sharding, persistence, authentication, and abuse protection are not included.

Steering regression: run `npx playwright install chromium`, then `npm run test:browser` with the server running. Set `GAME_URL` to test the public tunnel instead. This checks actual movement in all four directions and verifies the camera does not drift.
