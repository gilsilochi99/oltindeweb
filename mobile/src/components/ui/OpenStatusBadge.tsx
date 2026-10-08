import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { isBranchOpenNow } from '../../lib/hours';
import type { Branch } from '../../lib/types';

const OPEN_COLOR = '#16A34A';
const CLOSED_COLOR = '#DC2626';

export function OpenStatusBadge({ branch }: { branch?: Branch | null }) {
  const [isOpen, setIsOpen] = useState<boolean | null>(() => isBranchOpenNow(branch?.workingHours));

  useEffect(() => {
    setIsOpen(isBranchOpenNow(branch?.workingHours));
    const interval = setInterval(() => setIsOpen(isBranchOpenNow(branch?.workingHours)), 60_000);
    return () => clearInterval(interval);
  }, [branch]);

  if (isOpen === null) return null;

  return (
    <View className="flex-row items-center gap-1.5">
      <Clock size={13} color={isOpen ? OPEN_COLOR : CLOSED_COLOR} />
      <Text className="text-xs font-semibold" style={{ color: isOpen ? OPEN_COLOR : CLOSED_COLOR }}>
        {isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
      </Text>
    </View>
  );
}
