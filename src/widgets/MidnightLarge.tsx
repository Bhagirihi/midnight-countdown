// Android home-screen widget: Large 2x2. Isolated 'widget' runtime —
// see MidnightSmall.tsx for the rules. Props only, via updateSnapshot.
// Milestone / story lines show only when the snapshot carries real
// values for the pinned event; empty strings render nothing.
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

type Props = { title: string; label: string; dateISO: string; nextTitle: string; nextLabel: string; milestoneLabel: string; storyDateISO: string };

const MidnightLarge = (props: Props) => {
  'widget';
  return (
    <Column modifiers={[background('#0F0F11'), paddingAll(14)]}>
      <Text color="#F7A5A5" style={{ fontSize: 32, fontWeight: '700' }}>{props.label}</Text>
      <Text color="#FAFAFA" style={{ fontSize: 16, fontWeight: '700' }}>{props.title}</Text>
      <Text color="#A1A1AA" style={{ fontSize: 12 }}>{props.dateISO}</Text>
      {props.milestoneLabel ? <Text color="#FCE570" style={{ fontSize: 13, fontWeight: '700' }}>{props.milestoneLabel}</Text> : null}
      {props.storyDateISO ? <Text color="#A1A1AA" style={{ fontSize: 12 }}>Next story: {props.storyDateISO}</Text> : null}
      <Text color="#8E99F3" style={{ fontSize: 14, fontWeight: '700' }}>{props.nextLabel}</Text>
      <Text color="#FAFAFA" style={{ fontSize: 13 }}>{props.nextTitle}</Text>
    </Column>
  );
};

export default createWidget('MidnightLarge', MidnightLarge, { title: 'No event yet', label: 'Add an event', dateISO: '', nextTitle: '', nextLabel: '', milestoneLabel: '', storyDateISO: '' });
