class Queue {
  constructor() {
    this.array = [];
  }
  push(item) {
    this.array.push(item);
  }
  pop() {
    return this.array.shift();
  }
  size() {
    return this.array.length;
  }
  isEmpty() {
    return this.size() <= 0;
  }
}

class PromiseQueue {
  constructor() {
    this.available = true;
    this.queue = new Queue();
  }
  push(func) {
    this.queue.push(func);
    checkAndPop();
  }
  executeEnd() {
    this.available = true;
    checkAndPop();
  }
  executeStart(func) {
    func(() => this.executeEnd());
  }
  checkAndPop() {
    if (!this.available) return;
    if (this.queue.isEmpty()) return;
    this.available = false;
    executeStart(this.queue.pop());
  }
}

const pqueue = new PromiseQueue();

const pqMiddleware = (req, res, next) => {
  req.pqueue = pqueue;
  next();
};

module.exports = pqMiddleware;
