import pLimit, { limitFunction } from 'p-limit';
const limit = pLimit(5);
const arr = Array.from({ length: 20 }, (it, index) => {
    return limit(() => new Promise(resolve => setTimeout(resolve, index * 100)))
})
Promise.all(arr).then(console.log)
const arrMixed = Array.from({ length: 20 }, (it, index) => {
    return limitFunction(() => new Promise(resolve => setTimeout(resolve, index * 80)), { concurrency: 5 })
})
Promise.all(arrMixed).then(console.log)
// 源码
function validate(limit) {
    if (!Number.isInteger(limit) || limit < 0) {
        throw new Error('err concurrency')
    }
}
function pLimit(concurrency) {
    validate(concurrency);
    let activeCount = 0;
    const activeQueue = [];
    const next = () => {
        // 1、next 执行当前 activeQueue 的下一个任务 activeCount-- 而不是 ++
        if (activeQueue.length) {
            activeQueue.shift()();
            activeCount++; // 2、不是增加，应该是减少
        }
    }
    const run = (fn, resolve, arg) => {
        activeCount--; // 3、执行函数时，执行一个计数一个 activeCount++
        const res = fn(...arg); // 4、少写了 try-catch 且 fn 是异步函数，需要 await 获取结果
        resolve(res);
        next()
    }
    const generator = (cb, ...args) => {
        return new Promise((resolve) => {
            if (activeCount < concurrency) {
                run(cb, resolve, args)
            } else {
                activeQueue.push(run.bind(null, cb, resolve, arg))
            }
        })
    }
    return generator;
}

async function execute(arr, concurrency) {
    const indexedArr = arr.map((it, index) => {
        return {
            index,
            promise: Promise.resolve(it).then(res => ({ key: index, value: res }))
        }
    })
    const activeArr = indexedArr.splice(0, concurrency);
    const result = [];
    while (activeArr.length) {
        const { key, value } = await Promise.race(activeArr.map(it => it.promise));
        const index = activeArr.findIndex(it => it.index === key);
        activeArr.splice(index, 1);
        result[key] = value;
        if (indexedArr.length) {
            activeArr.push(indexedArr.shift())
        }
    }
    return result
}