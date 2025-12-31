import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { createLibraryService, type InstalledComponent } from 'jlc-core';
import { useNavigation, useCurrentScreen } from '../navigation/NavigationContext.js';
import type { ListParams } from '../navigation/types.js';
import { useAppState } from '../state/AppStateContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { Divider } from '../components/Divider.js';

const libraryService = createLibraryService();

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

export function ListScreen() {
  const { push } = useNavigation();
  const { params } = useCurrentScreen() as { screen: 'list'; params: ListParams };
  const { selectedIndex, setSelectedIndex } = useAppState();
  const { columns: terminalWidth } = useTerminalSize();

  const [installed, setInstalled] = useState<InstalledComponent[]>(params.installed || []);
  const [isLoading, setIsLoading] = useState(!params.installed);

  useEffect(() => {
    if (!params.installed) {
      setIsLoading(true);
      libraryService
        .listInstalled({ category: params.category as any })
        .then(setInstalled)
        .catch(() => setInstalled([]))
        .finally(() => setIsLoading(false));
    }
  }, [params.installed, params.category]);

  useInput((input, key) => {
    if (isLoading) return;

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(installed.length - 1, selectedIndex + 1));
    } else if (key.return && installed[selectedIndex]) {
      push('info', {
        componentId: installed[selectedIndex].lcscId,
      });
    }
  });

  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">⏳ Loading installed components...</Text>
      </Box>
    );
  }

  if (installed.length === 0) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Installed Components</Text>
        </Box>
        <Text dimColor>No components installed yet. Use 'jlc search' to find and install components.</Text>
        <Box marginTop={1}>
          <Divider width={terminalWidth} />
        </Box>
        <Text dimColor>Esc Exit</Text>
        <Divider width={terminalWidth} />
      </Box>
    );
  }

  const nameWidth = Math.max(Math.floor((terminalWidth - 40) * 0.5), 20);
  const categoryWidth = Math.max(Math.floor((terminalWidth - 40) * 0.3), 15);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>
          Installed Components <Text dimColor>({installed.length} total)</Text>
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text bold dimColor>
          {'  '}
          {'JLCPCB'.padEnd(12)}
          {'Name'.padEnd(nameWidth)}
          {'Category'.padEnd(categoryWidth)}
          {'Symbol'}
        </Text>
      </Box>
      {installed.map((item, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Box key={item.lcscId}>
            <Text color={isSelected ? 'cyan' : undefined}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text inverse={isSelected}>
              <Text color="cyan">{item.lcscId.padEnd(12)}</Text>
              {truncate(item.name, nameWidth - 1).padEnd(nameWidth)}
              {truncate(item.category, categoryWidth - 1).padEnd(categoryWidth)}
              <Text dimColor>{truncate(item.symbolRef, 30)}</Text>
            </Text>
          </Box>
        );
      })}
      <Box marginTop={1} flexDirection="column">
        <Divider width={terminalWidth} />
        <Text dimColor>↑/↓ Navigate • Enter View Details • Esc Exit</Text>
        <Divider width={terminalWidth} />
      </Box>
    </Box>
  );
}
