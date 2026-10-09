import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ImagePlus, Star, X } from 'lucide-react-native';
import { uploadFileRaw } from '../../lib/api';
import { randomId } from '../../lib/storage';
import { absoluteUrl } from '../../lib/shop';

const MAX_SIDE = 1600; // px — plenty for the site, small on mobile data

// Photos are resized to 1600 px JPEG before upload (a phone photo is often
// 4–8 MB; this makes it ~200–400 KB).
async function shrink(uri: string, width?: number, height?: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if ((width ?? 0) > MAX_SIDE || (height ?? 0) > MAX_SIDE) {
    ctx.resize((width ?? 0) >= (height ?? 0) ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

// Grid of photos: add several at once, remove, and tap one to make it the
// main photo (first). `folder` is the upload folder, e.g. products/<companyId>.
export function PhotoPicker({ urls, onChange, folder, max }: { urls: string[]; onChange: (urls: string[]) => void; folder: string; max: number }) {
  const [uploading, setUploading] = useState(0);

  const add = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Permita el acceso a sus fotos para añadir imágenes.');
      return;
    }
    const room = max - urls.length;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: room, quality: 1 });
    if (result.canceled) return;
    const assets = result.assets.slice(0, room);
    setUploading(assets.length);
    const added: string[] = [];
    for (const asset of assets) {
      try {
        const small = await shrink(asset.uri, asset.width, asset.height);
        added.push(await uploadFileRaw(small, `${folder}/${randomId()}.jpg`));
      } catch (error) {
        Alert.alert('No se pudo subir una foto', error instanceof Error ? error.message : 'Inténtelo de nuevo.');
      }
      setUploading((n) => n - 1);
    }
    onChange([...urls, ...added]);
  };

  return (
    <View className="gap-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {urls.map((url, i) => (
          <Pressable key={url} onPress={() => onChange([url, ...urls.filter((u) => u !== url)])} className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
            <Image source={{ uri: absoluteUrl(url) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            {i === 0 ? (
              <View className="absolute bottom-1 left-1 flex-row items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-0.5">
                <Star size={10} color="#FFCD00" fill="#FFCD00" />
                <Text className="text-[10px] font-semibold text-white">Principal</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => onChange(urls.filter((u) => u !== url))}
              hitSlop={6}
              className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
              accessibilityLabel="Quitar foto"
            >
              <X size={14} color="#fff" />
            </Pressable>
          </Pressable>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <View key={`up-${i}`} className="h-24 w-24 items-center justify-center rounded-lg bg-muted">
            <ActivityIndicator color="#FFCD00" />
          </View>
        ))}
        {urls.length + uploading < max ? (
          <Pressable onPress={add} disabled={uploading > 0} className="h-24 w-24 items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input">
            <ImagePlus size={22} color="#8A8A8A" />
            <Text className="text-xs text-muted-foreground">Añadir</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <Text className="text-xs text-muted-foreground">
        {urls.length}/{max} fotos. Toque una foto para hacerla principal.
      </Text>
    </View>
  );
}
