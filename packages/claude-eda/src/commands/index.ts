/**
 * CLI commands
 */

export { initCommand, type InitOptions } from './init.js';
export { doctorCommand, type DoctorOptions } from './doctor.js';
export { updateCommand, type UpdateOptions } from './update.js';
export { configCommand, type ConfigOptions } from './config.js';
export { kicadIpcCommand, type KicadIpcOptions } from './kicad-ipc.js';
export {
  kicadMcpCommand,
  isKicadMcpInstalled,
  installKicadMcp,
  getKicadMcpPaths,
  getKicadMcpConfig,
  configureMcpJson,
  configureGlobalMcp,
} from './kicad-mcp.js';
export {
  kicadSchMcpCommand,
  isKicadSchMcpInstalled,
  installKicadSchMcp,
  getKicadSchMcpPaths,
  getKicadSchMcpConfig,
} from './kicad-sch-mcp.js';
