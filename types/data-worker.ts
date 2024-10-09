// types/web-worker.d.ts
declare module "worker-loader!*" {
  class WebWorker extends Worker {
    constructor();
  }

  export default WebWorker;
}
