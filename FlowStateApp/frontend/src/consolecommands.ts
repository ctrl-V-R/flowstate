import { fetchEndpoints, deleteEndpoint, pingAllEndpoints } from './connectionService';
import type { CommandState } from './types';

export const COMMAND_REGISTRY: Record<string, (args: string[], state: CommandState) => void> = {

  // REBOOT
  '/reboot': (args, { setLogs, setUptime, addNotify }) => {
    setLogs([]);
    setUptime(0);
    addNotify("SYSTEM_REBOOT", "Orchestrator cycled to zero.", "warn");
  },

  // FLUSH
  '/flush': (args, { setLogs }) => {
    setLogs([]);
  },

  // PING
  '/pingall': async (args, { setEndpoints, log, addNotify }) => {
    log("Initiating global cluster ping...", "info");
    
    const success = await pingAllEndpoints();
    
    if (success) {
      // Re-fetch to get the new 'lastSync' or 'status' values
      const updatedData = await fetchEndpoints();
      setEndpoints(updatedData);
      
      log("Ping cycle complete. All nodes responded.", "success");
      addNotify("Network Sync", "Cluster status updated successfully.", "success");
    } else {
      log("Ping cycle failed. Some nodes are unreachable.", "error");
      addNotify("Network Alert", "Cluster ping failed.", "error");
    }
  },

  // ENDPOINT + FLAGS

  '/endpoint': async (args, { endpoints, setEndpoints, log }) => {
    const [flag, target] = args;

    // Handle --list
    if (flag === '--list') {
      const list = endpoints.map(e => `${e.name} [${e.status}]`).join(', ');
      log(`Active Cluster: ${list || 'No active connections found.'}`, 'info');
      return;
    }

    // Handle --rm
    if (flag === '--rm' && target) {
      const exists = endpoints.find(e => e.name.toLowerCase() === target.toLowerCase());

      if (exists) {
        log(`Initiating teardown for ${target}...`, 'info');

        // 1. Call the API using the real ID from the 'exists' object
        const success = await deleteEndpoint(exists.id, target);

        if (success) {
          // 2. Update the global state so the UI stays in sync
          setEndpoints(prev => prev.filter(e => e.id !== exists.id));
          
          log(`Unmapped ${target} from cluster successfully.`, 'success');
        } else {
          log(`Server Error: Failed to remove ${target}. Check permissions.`, 'error');
        }
      } else {
        log(`Error: Endpoint "${target}" not found in current scope.`, 'error');
      }
      return;
    }

  // Fallback/Help
  log("Usage: /endpoint --rm [name] or /endpoint --list", "warn");
  }
};