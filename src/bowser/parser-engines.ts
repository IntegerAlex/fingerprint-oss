/*!
 * Bowser - a browser detector
 * https://github.com/bowser-js/bowser
 * MIT License | (c) Dustin Diaz 2012-2015
 * MIT License | (c) Denis Demchenko 2015-2019
 */
import Utils from './utils.js';
import { ENGINE_MAP } from './constants.js';
import type Parser from './parser.js';

interface EngineResult {
  name: string;
  version?: string;
}

interface EngineDescriptor {
  test: RegExp[] | ((parser: Parser) => boolean);
  describe: (ua?: string) => EngineResult;
}

/*
 * More specific goes first
 */
const enginesList: EngineDescriptor[] = [
  /* EdgeHTML */
  {
    test(parser: Parser) {
      return parser.getBrowserName(true) === 'microsoft edge';
    },
    describe(ua?: string) {
      const isBlinkBased = /\sedg\//i.test(ua || '');

      // return blink if it's blink-based one
      if (isBlinkBased) {
        return {
          name: ENGINE_MAP.Blink,
        };
      }

      // otherwise match the version and return EdgeHTML
      const version = Utils.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i, ua || '');

      return {
        name: ENGINE_MAP.EdgeHTML,
        version,
      };
    },
  },

  /* Trident */
  {
    test: [/trident/i],
    describe(ua?: string) {
      const engine: EngineResult = {
        name: ENGINE_MAP.Trident,
      };

      const version = Utils.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i, ua || '');

      if (version) {
        engine.version = version;
      }

      return engine;
    },
  },

  /* Presto */
  {
    test(parser: Parser) {
      return parser.test(/presto/i);
    },
    describe(ua?: string) {
      const engine: EngineResult = {
        name: ENGINE_MAP.Presto,
      };

      const version = Utils.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i, ua || '');

      if (version) {
        engine.version = version;
      }

      return engine;
    },
  },

  /* Gecko */
  {
    test(parser: Parser) {
      const isGecko = parser.test(/gecko/i);
      const likeGecko = parser.test(/like gecko/i);
      return isGecko && !likeGecko;
    },
    describe(ua?: string) {
      const engine: EngineResult = {
        name: ENGINE_MAP.Gecko,
      };

      const version = Utils.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i, ua || '');

      if (version) {
        engine.version = version;
      }

      return engine;
    },
  },

  /* Blink */
  {
    test: [/(apple)?webkit\/537\.36/i],
    describe() {
      return {
        name: ENGINE_MAP.Blink,
      };
    },
  },

  /* WebKit */
  {
    test: [/(apple)?webkit/i],
    describe(ua?: string) {
      const engine: EngineResult = {
        name: ENGINE_MAP.WebKit,
      };

      const version = Utils.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i, ua || '');

      if (version) {
        engine.version = version;
      }

      return engine;
    },
  },
];

export default enginesList;

