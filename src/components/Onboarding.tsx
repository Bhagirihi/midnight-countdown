import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, labelStyle } from '../lib/theme';
import { pickSinglePhoto } from '../lib/photos';
import BrandMark from './BrandMark';

export default function Onboarding({ onDone }: { onDone: (photoUri: string | null) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.column}>
        {step === 1 ? (
          <View>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} />
              <BrandMark align="left" />
            </View>
            <Text style={styles.numeral}>D-13</Text>
            <Text style={styles.title}>The days that matter,{'\n'}counted.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} />
              <BrandMark align="left" />
            </View>
            <Text style={styles.title}>Add a photo?</Text>
            <Text style={styles.lead}>Optional. It shows on your first event.</Text>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            ) : null}
            <Pressable
              onPress={async () => {
                const uri = await pickSinglePhoto();
                if (uri) setPhotoUri(uri);
              }}
              hitSlop={8}
              style={styles.photoAction}
            >
              <Text style={styles.photoActionText}>{photoUri ? 'CHANGE PHOTO' : 'ADD PHOTO'}</Text>
            </Pressable>
          </View>
        )}
        <View>
          {step === 1 ? <Text style={styles.copy}>One date. A number you can keep.</Text> : null}
          <Pressable
            style={styles.primary}
            onPress={() => (step === 1 ? setStep(2) : onDone(photoUri))}
          >
            <Text style={styles.primaryText}>{step === 1 ? 'BEGIN' : 'CONTINUE'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  column: { flex: 1, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 52, height: 52, borderRadius: 14 },
  numeral: {
    fontFamily: fonts.grotesk,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -2,
    color: colors.primary,
    marginTop: 20,
  },
  title: {
    fontFamily: fonts.grotesk,
    fontSize: 26,
    lineHeight: 32,
    color: colors.onSurface,
    marginTop: 12,
  },
  lead: {
    fontFamily: fonts.jakartaMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
  photo: { width: '100%', height: 160, borderRadius: 16, marginTop: 20, backgroundColor: colors.surface },
  photoAction: { alignSelf: 'flex-start', marginTop: 16 },
  photoActionText: { ...labelStyle, fontSize: 12, letterSpacing: 1.8, color: colors.primary },
  copy: {
    fontFamily: fonts.jakartaMedium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
  },
  primary: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...labelStyle, fontSize: 12, letterSpacing: 2.2, color: colors.onPrimary },
});
