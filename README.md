# Image Converter (React + Vite)

PNG, JPG, HEIC, WEBP aur doosri images ko WEBP / JPG / PNG me badlo. Ek baar me 100 files tak. Sab kuch browser me hota hai, files kahin upload nahi hoti.

## Setup

```bash
npm install
npm run dev
```

Browser me `http://localhost:5173` kholo.

## Production build

```bash
npm run build
```

`dist/` folder ko kisi bhi static hosting par daal sakte ho.

## Notes

- HEIC decode `heic2any` se hota hai. Ye thoda slow hai, 100 iPhone photos me kuch minute lag sakte hain.
- Canvas se convert hone par EXIF metadata (location, camera info) chala jata hai.
- Browser me HEIC output nahi banta. Output WEBP, JPG ya PNG hi hai.
