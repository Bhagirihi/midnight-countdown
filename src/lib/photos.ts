// Photo picking, LAZILY imported so Expo Go never pays a static-import
// cost for the picker module. URIs returned are device-local; they are
// stored as-is in AsyncStorage and may not survive an uninstall or a
// reinstall — the README says so plainly. Nothing here uploads anything.
import { MAX_STORY_PHOTOS } from './events';

export async function pickSinglePhoto(): Promise<string | null> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (res.canceled || res.assets.length === 0) return null;
    return res.assets[0].uri;
  } catch {
    return null;
  }
}

/** Picks up to `room` more photos (room already accounts for the 8 cap). */
export async function pickPhotos(room: number): Promise<string[]> {
  if (room <= 0) return [];
  try {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return [];
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.min(room, MAX_STORY_PHOTOS),
      quality: 0.8,
    });
    if (res.canceled) return [];
    return res.assets.map((a) => a.uri).slice(0, room);
  } catch {
    return [];
  }
}
