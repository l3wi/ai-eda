import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { createComponentService } from 'jlc-core';
import open from 'open';
import { useNavigation, useCurrentScreen } from '../navigation/NavigationContext.js';
import type { InfoParams, ComponentInfo } from '../navigation/types.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { DetailView, type DetailViewComponent } from '../components/DetailView.js';

const componentService = createComponentService();

export function InfoScreen() {
  const { push } = useNavigation();
  const { params } = useCurrentScreen() as { screen: 'info'; params: InfoParams };
  const { columns: terminalWidth } = useTerminalSize();

  const [component, setComponent] = useState<ComponentInfo | null>(
    params.component || null
  );
  const [isLoading, setIsLoading] = useState(!params.component);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.component && params.componentId) {
      setIsLoading(true);
      componentService
        .getDetails(params.componentId)
        .then((details) => {
          if (details) {
            setComponent(details);
          } else {
            setError('Component not found');
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch component');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [params.componentId, params.component]);

  // Get datasheet URL (different field names in different types)
  const datasheetUrl = component && ('datasheetPdf' in component ? component.datasheetPdf : 'datasheet' in component ? component.datasheet : undefined);

  useInput((input, key) => {
    if (isLoading || !component) return;

    if (key.return) {
      push('install', {
        componentId: component.lcscId,
        component,
      });
    } else if (input.toLowerCase() === 'd') {
      if (datasheetUrl) {
        open(datasheetUrl);
      }
    }
  });

  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">⏳ Loading component {params.componentId}...</Text>
      </Box>
    );
  }

  if (error || !component) {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ {error || 'Component not found'}</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>
          Component: <Text color="cyan">{component.lcscId}</Text>
          {' '}
          <Text dimColor>({component.name})</Text>
        </Text>
      </Box>
      <DetailView component={component} terminalWidth={terminalWidth} />
    </Box>
  );
}
