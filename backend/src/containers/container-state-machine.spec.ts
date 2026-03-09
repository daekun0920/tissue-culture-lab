import { ContainerStatus } from '@prisma/client';
import {
  isValidForAction,
  getTargetStatus,
  getValidActions,
  ALL_ACTIONS,
} from './container-state-machine';

describe('container-state-machine', () => {
  /* ------------------------------------------------------------------ */
  /*  ALL_ACTIONS                                                        */
  /* ------------------------------------------------------------------ */

  describe('ALL_ACTIONS', () => {
    it('should contain exactly 8 known actions', () => {
      expect(ALL_ACTIONS).toHaveLength(8);
      expect(ALL_ACTIONS).toEqual(
        expect.arrayContaining([
          'REGISTER_CONTAINER',
          'PREPARE_MEDIA',
          'ADD_CULTURE',
          'DISCARD_CULTURE',
          'DISCARD_CONTAINER',
          'SUBCULTURE',
          'EXIT_CULTURE',
          'WASH',
        ]),
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /*  isValidForAction — exhaustive 40-case matrix                       */
  /* ------------------------------------------------------------------ */

  describe('isValidForAction', () => {
    // Define all states: null (unregistered) + 4 ContainerStatus values
    const allStates: Array<ContainerStatus | null> = [
      null,
      ContainerStatus.EMPTY,
      ContainerStatus.HAS_MEDIA,
      ContainerStatus.HAS_CULTURE,
      ContainerStatus.DISCARDED,
    ];

    // Expected validity: action → set of valid states
    const validTransitions: Record<string, Array<ContainerStatus | null>> = {
      REGISTER_CONTAINER: [null],
      PREPARE_MEDIA: [ContainerStatus.EMPTY],
      ADD_CULTURE: [ContainerStatus.HAS_MEDIA],
      DISCARD_CULTURE: [ContainerStatus.HAS_CULTURE],
      DISCARD_CONTAINER: [
        ContainerStatus.EMPTY,
        ContainerStatus.HAS_MEDIA,
        ContainerStatus.HAS_CULTURE,
      ],
      SUBCULTURE: [ContainerStatus.HAS_CULTURE],
      EXIT_CULTURE: [ContainerStatus.HAS_CULTURE],
      WASH: [ContainerStatus.DISCARDED],
    };

    // Generate all 40 test cases (8 actions × 5 states)
    for (const action of ALL_ACTIONS) {
      for (const status of allStates) {
        const label = status === null ? 'null' : status;
        const expected = validTransitions[action]?.includes(status) ?? false;

        it(`${action} + ${label} → ${expected}`, () => {
          expect(isValidForAction(status, action)).toBe(expected);
        });
      }
    }

    it('should return false for an unknown action', () => {
      expect(isValidForAction(null, 'UNKNOWN')).toBe(false);
      expect(isValidForAction(ContainerStatus.EMPTY, 'UNKNOWN')).toBe(false);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getTargetStatus                                                    */
  /* ------------------------------------------------------------------ */

  describe('getTargetStatus', () => {
    it.each([
      ['REGISTER_CONTAINER', ContainerStatus.EMPTY],
      ['PREPARE_MEDIA', ContainerStatus.HAS_MEDIA],
      ['ADD_CULTURE', ContainerStatus.HAS_CULTURE],
      ['DISCARD_CULTURE', ContainerStatus.EMPTY],
      ['DISCARD_CONTAINER', ContainerStatus.DISCARDED],
      ['SUBCULTURE', ContainerStatus.EMPTY],
      ['EXIT_CULTURE', ContainerStatus.EMPTY],
      ['WASH', ContainerStatus.EMPTY],
    ])('%s → %s', (action, expected) => {
      expect(getTargetStatus(action)).toBe(expected);
    });

    it('should return undefined for an unknown action', () => {
      expect(getTargetStatus('UNKNOWN_ACTION')).toBeUndefined();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  getValidActions                                                    */
  /* ------------------------------------------------------------------ */

  describe('getValidActions', () => {
    it('null (unregistered) → only REGISTER_CONTAINER', () => {
      expect(getValidActions(null)).toEqual(['REGISTER_CONTAINER']);
    });

    it('EMPTY → PREPARE_MEDIA, DISCARD_CONTAINER', () => {
      const actions = getValidActions(ContainerStatus.EMPTY);
      expect(actions).toEqual(
        expect.arrayContaining(['PREPARE_MEDIA', 'DISCARD_CONTAINER']),
      );
      expect(actions).toHaveLength(2);
    });

    it('HAS_MEDIA → ADD_CULTURE, DISCARD_CONTAINER', () => {
      const actions = getValidActions(ContainerStatus.HAS_MEDIA);
      expect(actions).toEqual(
        expect.arrayContaining(['ADD_CULTURE', 'DISCARD_CONTAINER']),
      );
      expect(actions).toHaveLength(2);
    });

    it('HAS_CULTURE → DISCARD_CULTURE, DISCARD_CONTAINER, SUBCULTURE, EXIT_CULTURE', () => {
      const actions = getValidActions(ContainerStatus.HAS_CULTURE);
      expect(actions).toEqual(
        expect.arrayContaining([
          'DISCARD_CULTURE',
          'DISCARD_CONTAINER',
          'SUBCULTURE',
          'EXIT_CULTURE',
        ]),
      );
      expect(actions).toHaveLength(4);
    });

    it('DISCARDED → only WASH', () => {
      expect(getValidActions(ContainerStatus.DISCARDED)).toEqual(['WASH']);
    });
  });
});
