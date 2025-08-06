// src/app/actions/image-actions.ts
"use server";

import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  const folder = formData.get("folder") as string;
  const fileName = formData.get("fileName") as string;

  if (!file) {
    return { error: "No file provided." };
  }

  try {
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const response = await imagekit.upload({
      file: buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    return { success: true, url: response.url };
  } catch (error: any) {
    console.error("ImageKit Upload Error:", error);
    return { error: error.message || "Failed to upload image." };
  }
}
