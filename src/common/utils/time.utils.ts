import { EResolution } from 'common/constants/time';
import moment from 'moment';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export class TimeUtils {
  static startOfDayInSeconds(timestamp: number): number {
    return moment.unix(timestamp).startOf('days').unix();
  }

  static endOfDayInSeconds(timestamp: number): number {
    return moment.unix(timestamp).endOf('days').unix();
  }

  static standardizeResolutionTime(timestamp: number, resolution: EResolution): number {
    return timestamp - (timestamp % resolution);
  }

  static nowInSeconds(): number {
    return Math.floor(moment().utc().valueOf() / 1000);
  }

  static async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static ONE_DAY_IN_SECONDS = 24 * 60 * 60;

  static ONE_MINUTE_IN_SECONDS = 60;
}
