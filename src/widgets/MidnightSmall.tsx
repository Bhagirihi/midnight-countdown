// Android home-screen widget: Small 1x1. Isolated 'widget' runtime —
// no hooks, no async, no imports of app code, no constants referenced
// from outside this function. Data arrives only through props, pushed
// by the app via updateSnapshot (see src/lib/widgetSync.ts). This file
// is never imported by the app bundle's entry point; it is only
// dynamically imported by widgetSync, so Expo Go never evaluates it.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Props = { title: string; label: string };

const MidnightSmall = (props: Props) => {
  'widget';
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(12)]}>
      <Text color="#F7A5A5" style={{ fontSize: 28, fontWeight: '700' }}>{props.label}</Text>
      <Text color="#FAFAFA" style={{ fontSize: 14, fontWeight: '700' }}>{props.title}</Text>
    </Column>
  );
};

export default createWidget('MidnightSmall', MidnightSmall, { title: 'No event yet', label: 'Add an event' });
