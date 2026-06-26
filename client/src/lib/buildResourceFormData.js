export function appendImagesToFormData(formData, images = [], coverImage = null) {
  const existingImages = [];
  const newImageCaptions = [];

  let newFileIndex = 0;
  let coverNewIndex = "";

  images.forEach((image) => {
    if (image.file) {
      if (coverImage?.id === image.id) {
        coverNewIndex = String(newFileIndex);
      }

      formData.append("new_images", image.file);
      newImageCaptions.push(image.caption || "");
      newFileIndex += 1;
      return;
    }

    if (image.image_url) {
      existingImages.push({
        image_url: image.image_url,
        caption: image.caption || "",
      });
    }
  });

  formData.append("existing_images", JSON.stringify(existingImages));
  formData.append("new_image_captions", JSON.stringify(newImageCaptions));

  if (coverImage?.file) {
    formData.append("cover_image", "");
    formData.append("cover_new_index", coverNewIndex);
  } else {
    formData.append("cover_image", coverImage?.image_url || "");
    formData.append("cover_new_index", "");
  }

  return formData;
}