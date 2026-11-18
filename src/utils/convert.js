import heic2any from "heic2any";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i;

// File image hai ya nahi. HEIC ka type kai browsers me khaali aata hai,
// isliye file ka naam bhi check karte hain.
export function isImageFile(file) {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

export function isHeic(file) {
  return /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
}

// HEIC ko JPEG blob me badlo, taaki browser usse load kar sake
async function decodeHeic(file) {
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  // Multi-image HEIC ke case me array aata hai, pehli image le lo
  return Array.isArray(result) ? result[0] : result;
}

async function getImageSource(file) {
  if (isHeic(file)) {
    const jpegBlob = await decodeHeic(file);
    return new File([jpegBlob], file.name, { type: "image/jpeg" });
  }
  return file;
}

export async function loadImage(file) {
  const source = await getImageSource(file);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Load failed: ${file.name}`));
    };
    img.src = url;
  });
}

export function drawToBlob(img, mime, quality, maxWidth) {
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (maxWidth > 0 && w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // JPG me transparency nahi hoti, isliye white background
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve) =>
    canvas.toBlob(resolve, mime, quality / 100)
  );
}

export function getExt(mime) {
  return mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
}