class CallbackChainContext {
  constructor (callback) {
    this.callback = callback;
    this.chains = [];
    this.done = false;
    this.val = undefined;
    this.err = undefined;
  }

  chain(callback) {
    let chain = new CallbackChainContext(callback);
    this.chains.push(chain);
    if (this.done) {
      Executor._executeChains(this);
    }

    return chain;
  }
}

class CallbackChain {
    constructor(callback) {
      this.context = new CallbackChainContext(callback);
      Executor._execute(this.context);
    }
    chain(callback) {
      return this.context.chain(callback);
    }
}

class Executor {
  static chain(callback) {
    let chain = this.context.chain(callback);
    if (this.context.done) {
      this._executeChains(this.context);
    }
    return chain;
  }

  static _execute(context, initErr, initVal) {
    let callback = context.callback;
    let length = callback.length;
    let err, ret;

    try {
      ret = callback(initErr, initVal, this._done.bind(this, context));
    } catch {
      err = _err;
    } finally {
      if (err) {
        this._done(context, err);
        return;
      }
      if (length < 3) {
        this._done(context, undefined, ret);
      }
    }
  }

  static _done(context, err, val) {
    if (context.done) {
      return;
    }
    context.done = true;
    context.err = err;
    context.val = val;

    this._executeChains(context);
  }

  static _executeChains(context) {
    let chain;
    while((chain = context.chains.shift())) {
      this._execute(chain, context, err, context.val);
    }
  }
}

let cbChain = new CallbackChain((err, val ,done) => {
  console.log(err, val);
  setTimeout(() => {
    done(undefined, { ok: 1 });
  });
});

let cbChain2 = cbChain
  .chain((err, val) => {
    console.log(err, val);
    return {
      ok: 2
    };
  })
  .chain((err, val) => {
    console.log(err, val);
    return val;
  });

let cbChain3 = cbChain
  .chain((err, val , done) => {
    console.log(err, val);
    done(undefined, {
      ok: 3
    });
  })
  .chain((err, val) => {
    console.log(err, val);
    return val;
  });