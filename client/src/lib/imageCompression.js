const DEFAULT_TARGET_SIZE = 350 * 1024; // 350 KB
const DEFAULT_MAX_SIZE = 650 * 1024; // 650 KB
const DEFAULT_MAX_WIDTH = 1400;
const DEFAULT_MAX_HEIGHT = 1400;

function getImageFileFromItem(image) {
  return image?.file || image?.rawFile || image?.imageFile || image?.newFile || null;
}

function setImageFileToItem(image, compressedFile) {
  const updatedImage = { ...image };

  if (
    "file" in updatedImage ||
    (!("rawFile" in updatedImage) &&
      !("imageFile" in updatedImage) &&
      !("newFile" in updatedImage))
  ) {
    updatedImage.file = compressedFile;
  }

  if ("rawFile" in updatedImage) {
    updatedImage.rawFile = compressedFile;
  }

  if ("imageFile" in updatedImage) {
    updatedImage.imageFile = compressedFile;
  }

  if ("newFile" in updatedImage) {
    updatedImage.newFile = compressedFile;
  }

  return updatedImage;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Failed to load image for compression."));
    };

    image.src = imageUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function calculateSize(width, height, maxWidth, maxHeight) {
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio, 1);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function drawImageToCanvas(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser does not support canvas image compression.");
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

async function createSafeFileFromBlob(blob, fileName) {
  const arrayBuffer = await blob.arrayBuffer();

  // Important fix:
  // Convert any SharedArrayBuffer-backed data into a normal ArrayBuffer copy.
  const safeBytes = Uint8Array.from(new Uint8Array(arrayBuffer));

  return new File([safeBytes], fileName, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function compressImageFile(
  file,
  {
    targetBytes = DEFAULT_TARGET_SIZE,
    maxBytes = DEFAULT_MAX_SIZE,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    startQuality = 0.78,
    minQuality = 0.45,
  } = {},
) {
  if (!(file instanceof File)) {
    return file;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not a valid image file.`);
  }

  const image = await loadImage(file);

  let { width, height } = calculateSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxWidth,
    maxHeight,
  );

  let canvas = drawImageToCanvas(image, width, height);
  let quality = startQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  while (blob.size > targetBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.08);
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  while (blob.size > maxBytes && width > 700 && height > 700) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);

    canvas = drawImageToCanvas(image, width, height);
    blob = await canvasToBlob(canvas, "image/webp", minQuality);
  }

  const cleanName = file.name.replace(/\.[^.]+$/, "");
  const finalFileName = `${cleanName}.webp`;

  return createSafeFileFromBlob(blob, finalFileName);
}

export async function compressImagesForUpload(images = [], options = {}) {
  const compressedImages = [];

  for (const image of images) {
    const imageFile = getImageFileFromItem(image);

    if (!(imageFile instanceof File)) {
      compressedImages.push(image);
      continue;
    }

    const compressedFile = await compressImageFile(imageFile, options);

    compressedImages.push(setImageFileToItem(image, compressedFile));
  }

  return compressedImages;
}

export function getUploadFilesFromImages(images = []) {
  return images
    .map((image) => getImageFileFromItem(image))
    .filter((file) => file instanceof File);
}

export function getTotalUploadSize(images = []) {
  return getUploadFilesFromImages(images).reduce((total, file) => {
    return total + file.size;
  }, 0);
}

export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}