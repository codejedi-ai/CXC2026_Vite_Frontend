import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadProfilePicture(file: File, userId: string): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `profile_pic/${userId}`;

    const { error: deleteError } = await supabase.storage
      .from('profile-images')
      .remove([filePath]);

    if (deleteError && deleteError.message !== 'Object not found') {
      console.warn('Could not delete old profile picture:', deleteError);
    }

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function uploadBannerPicture(file: File, userId: string): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `Banner/${userId}`;

    const { error: deleteError } = await supabase.storage
      .from('profile-images')
      .remove([filePath]);

    if (deleteError && deleteError.message !== 'Object not found') {
      console.warn('Could not delete old banner:', deleteError);
    }

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}
