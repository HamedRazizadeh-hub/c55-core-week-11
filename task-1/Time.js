export class Time {
  #secondsFromMidnight;

  constructor(hours, minutes, seconds) {
    this.#secondsFromMidnight = hours * 3600 + minutes * 60 + seconds;
    this.#normalize();
  }

  // Private helper to keep seconds in 0..86399
  #normalize() {
    this.#secondsFromMidnight %= 86400;
    if (this.#secondsFromMidnight < 0) {
      this.#secondsFromMidnight += 86400;
    }
  }

  getHours() {
    return Math.floor(this.#secondsFromMidnight / 3600);
  }

  getMinutes() {
    return Math.floor((this.#secondsFromMidnight % 3600) / 60);
  }

  getSeconds() {
    return this.#secondsFromMidnight % 60;
  }

  addSeconds(seconds) {
    this.#secondsFromMidnight += seconds;
    this.#normalize();
  }

  addMinutes(minutes) {
    this.addSeconds(minutes * 60);
  }

  addHours(hours) {
    this.addSeconds(hours * 3600);
  }

  toString() {
    const hh = String(this.getHours()).padStart(2, "0");
    const mm = String(this.getMinutes()).padStart(2, "0");
    const ss = String(this.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
}
