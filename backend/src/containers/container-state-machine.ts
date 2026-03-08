import { ContainerStatus } from '@prisma/client';

/**
 * Maps an action name to the target ContainerStatus it produces.
 */
const ACTION_MAP: Record<string, ContainerStatus> = {
  REGISTER_CONTAINER: ContainerStatus.EMPTY,
  PREPARE_MEDIA: ContainerStatus.HAS_MEDIA,
  ADD_CULTURE: ContainerStatus.HAS_CULTURE,
  DISCARD_CULTURE: ContainerStatus.EMPTY,
  DISCARD_CONTAINER: ContainerStatus.DISCARDED,
  SUBCULTURE: ContainerStatus.EMPTY,
  EXIT_CULTURE: ContainerStatus.EMPTY,
  WASH: ContainerStatus.EMPTY,
};

/**
 * Defines which statuses a container must be in for each action to be valid.
 * An empty array means the action is only valid for unregistered containers (null status).
 */
const ACTION_VALID_STATUSES: Record<string, ContainerStatus[]> = {
  REGISTER_CONTAINER: [], // only for unregistered QRs
  PREPARE_MEDIA: [ContainerStatus.EMPTY],
  ADD_CULTURE: [ContainerStatus.HAS_MEDIA],
  DISCARD_CULTURE: [ContainerStatus.HAS_CULTURE, ContainerStatus.HAS_MEDIA],
  DISCARD_CONTAINER: [
    ContainerStatus.EMPTY,
    ContainerStatus.HAS_MEDIA,
    ContainerStatus.HAS_CULTURE,
  ],
  SUBCULTURE: [ContainerStatus.HAS_CULTURE],
  EXIT_CULTURE: [ContainerStatus.HAS_CULTURE],
  WASH: [ContainerStatus.DISCARDED],
};

/**
 * Returns true when the given status (or null for unregistered) is valid for the action.
 */
export function isValidForAction(
  status: ContainerStatus | null,
  action: string,
): boolean {
  const validStatuses = ACTION_VALID_STATUSES[action];
  if (!validStatuses) return false;

  // REGISTER_CONTAINER is only valid for unregistered containers
  if (action === 'REGISTER_CONTAINER') {
    return status === null;
  }

  // All other actions require the container to exist
  if (status === null) return false;

  return validStatuses.includes(status);
}

/**
 * Returns the ContainerStatus an action resolves to, or undefined
 * if the action is not recognised.
 */
export function getTargetStatus(action: string): ContainerStatus | undefined {
  return ACTION_MAP[action];
}

/**
 * Returns the list of action names that are valid for a container
 * currently in the given status (or null for unregistered).
 */
export function getValidActions(status: ContainerStatus | null): string[] {
  return Object.entries(ACTION_VALID_STATUSES)
    .filter(([action, validStatuses]) => {
      if (action === 'REGISTER_CONTAINER') return status === null;
      if (status === null) return false;
      return validStatuses.includes(status);
    })
    .map(([action]) => action);
}

/**
 * All known action names.
 */
export const ALL_ACTIONS = Object.keys(ACTION_MAP);
