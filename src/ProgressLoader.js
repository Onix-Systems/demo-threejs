class ProgressLoader {
  loadingBar;

  show() {
    this.loadingBar = {
      div: document.createElement('div'),
      bg: document.createElement('div'),
      load: document.createElement('div'),
      txt: document.createElement('h2'),
      progress: 0,
      limit: 0
    }
    document.body.appendChild(this.loadingBar.div);
    this.loadingBar.div.appendChild(this.loadingBar.bg);
    this.loadingBar.bg.appendChild(this.loadingBar.txt);
    this.loadingBar.bg.appendChild(this.loadingBar.load);
    this.loadingBar.div.className = 'loading_bar_container';
    this.loadingBar.txt.innerText = 'Loading model';
    this.loadingBar.txt.className = 'loading_bar_text';
    this.loadingBar.bg.className = 'loading_bar_background';
    this.loadingBar.load.className = 'loading_bar_loader';
  }

  setLimit(val) {
    this.loadingBar.limit = val;
  }

  addLimit(val) {
    this.loadingBar.limit += val;
  }

  hide() {
    this.setLimit(100);
  }

  update(delta) {
    if (this.loadingBar) {
      this.loadingBar.progress = Math.min(this.loadingBar.progress + 50 * delta, this.loadingBar.limit);
      if (this.loadingBar.progress < 100) {
        this.loadingBar.load.style = `width: ${this.loadingBar.progress}%;`;
      } else {
        this.remove();
      }
    }
  }

  remove() {
    this.loadingBar.load.remove();
    this.loadingBar.bg.remove();
    this.loadingBar.txt.remove();
    this.loadingBar.div.remove();
    this.loadingBar = null;
  }
}

export { ProgressLoader };