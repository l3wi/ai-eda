/**
 * Interactive Search TUI
 * Pure ink implementation - no external input libraries
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { createComponentService, createLibraryService, type ComponentSearchResult } from 'jlc-core';
import open from 'open';

// Hook to get terminal dimensions and listen for resize
function useTerminalSize() {
  const [size, setSize] = useState({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
      });
    };

    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return size;
}

const componentService = createComponentService();
const libraryService = createLibraryService();

type View = 'list' | 'detail' | 'installing' | 'installed';

interface SearchAppProps {
  initialResults: ComponentSearchResult[];
  query: string;
}

function formatStock(stock: number): string {
  if (stock < 1000) return String(stock);
  return '>1k';
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

// Divider component - uses full terminal width
function Divider({ width }: { width: number }) {
  return <Text dimColor>{'─'.repeat(Math.max(width - 2, 10))}</Text>;
}

// List View Component
function ListView({
  results,
  selectedIndex,
  isFiltered,
  terminalWidth,
}: {
  results: ComponentSearchResult[];
  selectedIndex: number;
  isFiltered: boolean;
  terminalWidth: number;
}) {
  // Calculate column widths based on terminal width
  const minWidth = 100;
  const availableWidth = Math.max(terminalWidth - 4, minWidth); // -4 for padding/indicator

  // Fixed columns: JLCPCB(10), Stock(6), Price(7), Library(8) = 31
  // Variable columns: MFR.Part, Type, Package
  const fixedWidth = 31 + 6; // fixed cols + spacing
  const variableWidth = availableWidth - fixedWidth;

  const mfrPartWidth = Math.max(Math.floor(variableWidth * 0.35), 15);
  const typeWidth = Math.max(Math.floor(variableWidth * 0.35), 12);
  const pkgWidth = Math.max(variableWidth - mfrPartWidth - typeWidth, 10);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold dimColor>
          {'  '}
          {'JLCPCB'.padEnd(10)}
          {' '}
          {'MFR.Part'.padEnd(mfrPartWidth)}
          {'Type'.padEnd(typeWidth)}
          {'Package'.padEnd(pkgWidth)}
          {'Stock'.padStart(6)}
          {'Price'.padStart(8)}
          {'  Library'}
        </Text>
      </Box>
      {results.map((r, i) => {
        const isSelected = i === selectedIndex;
        const jlcpcb = r.lcscId.padEnd(10);
        const mfrPart = truncate(r.name || '', mfrPartWidth - 1).padEnd(mfrPartWidth);
        const type = truncate(r.category || '', typeWidth - 1).padEnd(typeWidth);
        const pkg = truncate(r.package || '', pkgWidth - 1).padEnd(pkgWidth);
        const stock = formatStock(r.stock || 0).padStart(6);
        const price = r.price ? `$${r.price.toFixed(2)}`.padStart(8) : '     N/A';
        const library = r.libraryType === 'basic' ? 'Basic' : 'Extended';
        const libraryColor = r.libraryType === 'basic' ? 'green' : 'yellow';

        return (
          <Box key={r.lcscId}>
            <Text color={isSelected ? 'cyan' : undefined}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text inverse={isSelected}>
              <Text color="cyan">{jlcpcb}</Text>
              {' '}
              {mfrPart}
              {type}
              {pkg}
              {stock}
              {price}
              {'  '}
              <Text color={libraryColor}>{library}</Text>
            </Text>
          </Box>
        );
      })}
      <Box marginTop={1} flexDirection="column">
        <Divider width={terminalWidth} />
        <Box paddingY={0}>
          <Text dimColor>
            ↑/↓ Navigate • Enter View • Tab {isFiltered ? 'All Parts' : 'Basic Only'} • Esc Exit
          </Text>
        </Box>
        <Divider width={terminalWidth} />
      </Box>
    </Box>
  );
}

// Detail View Component
function DetailView({
  component,
  terminalWidth,
}: {
  component: ComponentSearchResult;
  terminalWidth: number;
}) {
  const isWide = terminalWidth >= 100;
  const colWidth = isWide ? 45 : terminalWidth - 4;

  // Description at top, full width
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
          <Text>{formatStock(component.stock)}</Text>
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

  // Datasheet at bottom, full width, no truncation
  const datasheet = component.datasheetPdf ? (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>Datasheet</Text>
      <Text color="blue" wrap="wrap">{component.datasheetPdf}</Text>
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

// Installed View Component
function InstalledView({
  component,
  result,
  error,
  terminalWidth,
}: {
  component: ComponentSearchResult;
  result: { symbolRef: string; footprintRef: string } | null;
  error: string | null;
  terminalWidth: number;
}) {
  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Installation failed: {error}</Text>
        <Box marginTop={1} flexDirection="column">
          <Divider width={terminalWidth} />
          <Text dimColor>Press any key to go back</Text>
          <Divider width={terminalWidth} />
        </Box>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Installation failed</Text>
        <Box marginTop={1} flexDirection="column">
          <Divider width={terminalWidth} />
          <Text dimColor>Press any key to go back</Text>
          <Divider width={terminalWidth} />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green" bold>✓ Installed {component.lcscId}</Text>
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text dimColor>{'Symbol     '}</Text>
          <Text color="cyan">{result.symbolRef}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Footprint  '}</Text>
          <Text color="cyan">{result.footprintRef}</Text>
        </Box>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Divider width={terminalWidth} />
        <Text dimColor>Press any key to continue</Text>
        <Divider width={terminalWidth} />
      </Box>
    </Box>
  );
}

// Main App Component
function SearchApp({ initialResults, query }: SearchAppProps) {
  const { exit } = useApp();
  const { columns: terminalWidth } = useTerminalSize();
  const [view, setView] = useState<View>('list');
  const [results, setResults] = useState(initialResults);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [installResult, setInstallResult] = useState<{ symbolRef: string; footprintRef: string } | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const selectedComponent = results[selectedIndex];

  useInput(async (input, key) => {
    // List view navigation
    if (view === 'list' && !isSearching) {
      if (key.upArrow) {
        setSelectedIndex((i: number) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedIndex((i: number) => Math.min(results.length - 1, i + 1));
      } else if (key.return) {
        setView('detail');
      } else if (key.escape) {
        exit();
      } else if (key.tab) {
        // Toggle basic/preferred filter
        setIsSearching(true);
        const newFiltered = !isFiltered;
        try {
          let newResults = await componentService.search(query, {
            limit: 20,
            basicOnly: newFiltered,
          });
          // Sort basic first
          newResults = newResults.sort((a, b) => {
            if (a.libraryType === 'basic' && b.libraryType !== 'basic') return -1;
            if (a.libraryType !== 'basic' && b.libraryType === 'basic') return 1;
            return 0;
          });
          setResults(newResults);
          setSelectedIndex(0);
          setIsFiltered(newFiltered);
        } catch {
          // Keep existing results on error
        }
        setIsSearching(false);
      }
    }
    // Detail view actions
    else if (view === 'detail') {
      if (key.escape) {
        setView('list');
      } else if (key.return) {
        setView('installing');
        setInstallError(null);
        try {
          const result = await libraryService.install(selectedComponent.lcscId, {});
          setInstallResult({
            symbolRef: result.symbolRef || `JLC:${selectedComponent.name}`,
            footprintRef: result.footprintRef || `JLC:${selectedComponent.name}`,
          });
          setView('installed');
        } catch (err) {
          setInstallError(err instanceof Error ? err.message : 'Unknown error');
          setView('installed');
        }
      } else if (input.toLowerCase() === 'd') {
        if (selectedComponent?.datasheetPdf) {
          open(selectedComponent.datasheetPdf);
        }
      }
    }
    // Installed view - any key goes back
    else if (view === 'installed') {
      setView('list');
      setInstallResult(null);
      setInstallError(null);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>
          Search: <Text color="cyan">{query}</Text>
          {' '}
          <Text dimColor>({results.length} results{isFiltered ? ' - Basic/Preferred only' : ''})</Text>
          {isSearching && <Text color="yellow"> ⏳</Text>}
        </Text>
      </Box>

      {view === 'list' && (
        <ListView results={results} selectedIndex={selectedIndex} isFiltered={isFiltered} terminalWidth={terminalWidth} />
      )}

      {view === 'detail' && selectedComponent && (
        <DetailView component={selectedComponent} terminalWidth={terminalWidth} />
      )}

      {view === 'installing' && selectedComponent && (
        <Box>
          <Text color="yellow">⏳ Installing {selectedComponent.lcscId}...</Text>
        </Box>
      )}

      {view === 'installed' && selectedComponent && (
        <InstalledView component={selectedComponent} result={installResult} error={installError} terminalWidth={terminalWidth} />
      )}
    </Box>
  );
}

export function renderSearchApp(results: ComponentSearchResult[], query: string): void {
  render(<SearchApp initialResults={results} query={query} />);
}
