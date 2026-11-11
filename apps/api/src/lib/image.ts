import sharp from "sharp";
import { ValidationError } from "../errors/AppError.js";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_SIDE = 800;

export interface ProcessedImage {
  data: Buffer;
  contentType: "image/webp";
}

// Valida que el archivo sea realmente una imagen (se mira el contenido, no el mimetype que
// declara el cliente), la gira según EXIF, la achica a MAX_SIDE y la convierte a WebP.
// Así la base nunca guarda una foto de 5 MB ni un archivo que no es una imagen.
export async function processProductImage(input: Buffer): Promise<ProcessedImage> {
  try {
    const { format } = await sharp(input).metadata();
    if (!format || !ALLOWED_FORMATS.has(format)) {
      throw new ValidationError("Image must be a JPG, PNG or WebP file");
    }
    const data = await sharp(input)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { data, contentType: "image/webp" };
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError("File is not a valid image");
  }
}
