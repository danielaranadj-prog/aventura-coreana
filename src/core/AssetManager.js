// ============================================================
// CARGADOR DE SPRITES (AssetManager)
// ============================================================

export class AssetManager {
  constructor(config) {
    this.config = config;
    this.images = {};
    this.loaded = 0;
    this.total = Object.keys(config.files).length;
    this.onProgress = null;
    this.onComplete = null;
  }

  load() {
    const promises = [];
    for (const [name, fileInfo] of Object.entries(this.config.files)) {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images[name] = {
            image: img,
            frames: fileInfo.frames,
            speed: fileInfo.speed,
            cols: fileInfo.cols,
            rows: fileInfo.rows,
            frameWidth: fileInfo.frameWidth,
            frameHeight: fileInfo.frameHeight,
            scale: fileInfo.scale,
            offsetX: fileInfo.offsetX,
            offsetY: fileInfo.offsetY,
          };
          this.loaded++;
          if (this.onProgress) this.onProgress(this.loaded, this.total);
          resolve();
        };
        img.onerror = () => reject(new Error(`No se pudo cargar: ${fileInfo.src}`));
        img.src = fileInfo.src;
      });
      promises.push(promise);
    }

    return Promise.all(promises)
      .then(() => {
        if (this.onComplete) this.onComplete();
      })
      .catch(err => {
        console.error('Error en carga:', err);
        if (this.onComplete) this.onComplete();
      });
  }

  get(name) { return this.images[name]; }
}
