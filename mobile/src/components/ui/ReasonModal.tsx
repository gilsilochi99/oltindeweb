import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from './Button';

// Asks for a reason the customer will see (cancel / reject). Quick options
// plus free text; Android alerts can't take text or more than 3 buttons.
export function ReasonModal({
  visible,
  title,
  description,
  options,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  description?: string;
  options: string[];
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="gap-3 rounded-t-3xl bg-background p-5 pb-8">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
          <View className="flex-row flex-wrap gap-2">
            {options.map((o) => (
              <Pressable
                key={o}
                onPress={() => setReason(o)}
                className={`rounded-full border px-3.5 py-2 ${reason === o ? 'border-primary bg-primary' : 'border-input bg-card'}`}
              >
                <Text className={`text-sm ${reason === o ? 'font-semibold text-primary-foreground' : 'text-foreground'}`}>{o}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="O escriba el motivo…"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[60px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
          <Button onPress={() => onConfirm(reason.trim())} disabled={reason.trim().length < 3}>{confirmLabel}</Button>
          <Button variant="ghost" onPress={onClose}>Volver</Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
