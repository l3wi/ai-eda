import React from 'react';
import { Box, Text } from 'ink';
import { Divider } from './Divider.js';

// Flexible component type that accepts both ComponentSearchResult and ComponentDetails
export interface DetailViewComponent {
  lcscId: string;
  name?: string;
  manufacturer?: string;
  package?: string;
  stock?: number;
  price?: number;
  libraryType?: 'basic' | 'extended';
  description?: string;
  datasheetPdf?: string;
  datasheet?: string; // ComponentDetails uses this instead of datasheetPdf
  attributes?: Record<string, unknown>;
}

interface DetailViewProps {
  component: DetailViewComponent;
  terminalWidth: number;
}

function formatStock(stock: number): string {
  if (stock < 1000) return String(stock);
  return '>1k';
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

export function DetailView({ component, terminalWidth }: DetailViewProps) {
  const isWide = terminalWidth >= 100;
  const colWidth = isWide ? 45 : terminalWidth - 4;

  const description = (
    <Box flexDirection="column" marginBottom={1}>
      <Text dimColor>Description</Text>
      <Text wrap="wrap">{component.description || 'No description'}</Text>
    </Box>
  );

  const partInfo = (
    <Box flexDirection="column" width={colWidth}>
      <Text bold underline color="cyan">Part Info</Text>
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text dimColor>{'Manufacturer    '}</Text>
          <Text>{truncate(component.manufacturer || 'N/A', 25)}</Text>
        </Box>
        <Box>
          <Text dimColor>{'MFR.Part #      '}</Text>
          <Text bold>{truncate(component.name || 'N/A', 25)}</Text>
        </Box>
        <Box>
          <Text dimColor>{'JLCPCB Part #   '}</Text>
          <Text color="cyan" bold>{component.lcscId}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Package         '}</Text>
          <Text>{truncate(component.package || 'N/A', 25)}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Stock           '}</Text>
          <Text>{component.stock !== undefined ? formatStock(component.stock) : 'N/A'}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Price           '}</Text>
          <Text color="green">{component.price ? `$${component.price.toFixed(4)}` : 'N/A'}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Library Type    '}</Text>
          <Text color={component.libraryType === 'basic' ? 'green' : 'yellow'}>
            {component.libraryType === 'basic' ? 'Basic (no extra fee)' : 'Extended (setup fee)'}
          </Text>
        </Box>
      </Box>
    </Box>
  );

  const hasAttributes = component.attributes && Object.keys(component.attributes).length > 0;
  const attributes = hasAttributes ? (
    <Box flexDirection="column" marginLeft={isWide ? 4 : 0} marginTop={isWide ? 0 : 2} width={colWidth}>
      <Text bold underline color="cyan">Attributes</Text>
      <Box marginTop={1} flexDirection="column">
        {Object.entries(component.attributes!).slice(0, 10).map(([key, value]) => (
          <Box key={key}>
            <Text dimColor>{truncate(key, 18).padEnd(18)} </Text>
            <Text>{truncate(String(value), 22)}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  ) : null;

  const datasheetUrl = component.datasheetPdf || component.datasheet;
  const datasheet = datasheetUrl ? (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>Datasheet</Text>
      <Text color="blue" wrap="wrap">{datasheetUrl}</Text>
    </Box>
  ) : null;

  return (
    <Box flexDirection="column">
      {description}
      <Box flexDirection={isWide ? 'row' : 'column'}>
        {partInfo}
        {attributes}
      </Box>
      {datasheet}
      <Box marginTop={1} flexDirection="column">
        <Divider width={terminalWidth} />
        <Box paddingY={0}>
          <Text dimColor>Enter Install • D Open Datasheet • Esc Back</Text>
        </Box>
        <Divider width={terminalWidth} />
      </Box>
    </Box>
  );
}
