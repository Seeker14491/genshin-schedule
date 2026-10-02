/** The current time, shared by everything on the page that shows or calculates time. */
class Clock {
  /** Unix time in milliseconds, updated every second. */
  now = $state(Date.now());

  /** `now` rounded down to the minute, for things that only need to update once a minute. */
  minute = $derived(Math.floor(this.now / 60000) * 60000);

  constructor() {
    // ticks at every whole second
    const tick = () => {
      this.now = Date.now();
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };

    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
}

export const clock = new Clock();
