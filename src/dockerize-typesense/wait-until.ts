import sleep from './sleep';

export default async function waitUntil(
  predicate: () => Promise<boolean>,
  timeout = 5000,
): Promise<void> {
  let isSettled = false;

  async function wait() {
    while (!isSettled) {
      const result = await predicate();
      if (result) {
        isSettled = true;
      } else {
        await sleep(1000);
      }
    }
  }
  await Promise.race([
    wait(),
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));

        isSettled = true;
      }, timeout);
    }),
  ]);
}
