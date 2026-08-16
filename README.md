# 🧥 Aventura 2D — TOMY Edition

Juego plataformero con personaje animado usando 2 archivos PNG separados.

---

## 📂 Estructura

```
Aventura2D_TOMY/
├── index.html          ← Abre este archivo en tu navegador
├── js/
│   └── game.js         ← Motor del juego
├── assets/
│   ├── TOMY-celebrate.png
│   └── TOMY-run.png
└── README.md           ← Esta guía
```

---

## 🚀 Pasos para usar

### 1. Copia tus archivos PNG

Coloca estos 2 archivos en la carpeta `assets/`:

```
assets/
├── TOMY-celebrate.png        ← 36 fotogramas (parado y celebración)
└── TOMY-run.png              ← 36 fotogramas (corriendo y salto)
```

### 2. Configura el tamaño de los fotogramas

Abre `js/game.js` y edita `SPRITE_CONFIG`:

```javascript
const SPRITE_CONFIG = {
  files: {
    run: {
      src: 'assets/TOMY-run.png',
      frames: 36,
      speed: 3,
      cols: 6,
      rows: 6,
      frameWidth: 464,
      frameHeight: 660,
    },
    celebrate: {
      src: 'assets/TOMY-celebrate.png',
      frames: 36,
      speed: 3,
    },
  },

};
```

### 3. Encuentra el tamaño de tus fotogramas

Si no sabes el tamaño exacto:

1. Abre uno de los PNG en cualquier visor de imágenes
2. Mira el ancho total de la imagen
3. Divide el ancho y el alto por la cantidad de columnas y filas.

**Ejemplo:**
- `TOMY-run.png` mide **2784 × 3960** píxeles y tiene 6 columnas × 6 filas.
- Cada frame mide **464 × 660** píxeles.

### 4. Abre el juego

Haz doble clic en `index.html` o abrelo con tu navegador.

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| `← →` / `A D` | Moverse |
| `↑` / `W` / `Espacio` | Saltar |
| `R` | Reiniciar |

---

## 🎨 Cómo funciona

El juego carga los 2 PNG por separado y extrae los fotogramas de cada uno:

- **Parado** → Muestra el frame 1 de `TOMY-celebrate.png`
- **Corriendo y saltando** → Usa `TOMY-run.png`
- **Celebrando** → Usa `TOMY-celebrate.png`, cicla entre sus 36 fotogramas (al ganar)

---

## 🛠️ Solución de problemas

**"Error cargando sprites"**
→ Verifica que los 2 archivos estén exactamente en `assets/` con los nombres correctos.

**El personaje se ve cortado o con líneas raras**
→ El `frameWidth` no es correcto. Mide el ancho total del PNG y divídelo por la cantidad de fotogramas.

**El personaje es gigante o diminuto**
→ Ajusta `scale` (ej: `0.8` para más pequeño, `2.0` para más grande).

**El personaje flota sobre el suelo**
→ Aumenta `offsetY` (menos negativo = más abajo).

**El personaje se hunde en el suelo**
→ Disminuye `offsetY` (más negativo = más arriba).

**La animación va muy lenta/rápida**
→ Ajusta `speed` en cada archivo (1 = muy rápido, 10 = muy lento).

---

## 💡 Consejos

- Si tus fotogramas tienen **fondo transparente**, se verán perfectos sobre el juego.
- Si tienen **fondo blanco/negro**, se verá un cuadrado alrededor del personaje.
- Para quitar el fondo de los PNG, usa [remove.bg](https://www.remove.bg) o GIMP.
