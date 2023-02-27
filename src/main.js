import App from './app.js';

const app = new App();
app.init();

(function animate () {
  requestAnimationFrame(animate);
  app.update();
})()