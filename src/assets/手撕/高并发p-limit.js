import pLimit, { limitFunction } from "p-limit";
const limit = pLimit(5);
const arr = Array.from({ length: 30 }, (it, index) => {
    return limit(() => new Promise(resolve => setTimeout(resolve, index * 99)))
})
Promise.all(arr).then(console.log)
const arr2 = Array.from({ length: 30 }, (it, index) => {
    return limitFunction(() => new Promise(resolve => setTimeout(resolve, index * 99)))
})
Promise.all(arr2).then(console.log)
function validate(limit) {
    if (!Number.isInteger(limit) || limit < 0) { throw new Error('limit err') }
}
function pLimit(concurrency) {
    validate(concurrency);
    let activeCount = 0;
    const activeQueue = [];
    const next = () => {
        activeCount++;  // ❌ 1、next 执行时，代表一个任务执行完成，activeCount--
        if (activeQueue.length) {
            activeQueue.shift()();
        }
    }
    const run = async (fn, resolve, arg) => {
        activeCount--; // ❌  2、 run 执行时代表一个任务开始执行 activeCount++
        // ❌ 3、少了 try-catch
        try {
            const res = await fn(...arg);
            resolve(res);
        } catch (e) { return Promise.reject(e) }
        next();
    }
    const generator = (cb, ...arg) => {
        return new Promise((resolve) => {
            if (activeCount < concurrency) {
                run(cb, resolve, arg)
            } else {
                activeQueue.push(run.bind(null, cb, resolve, arg))
            }
        })
    }
    return generator;
}
async function execute(arr, concurrency) {
    const indexedArr = arr.map((it, index) => ({
        index,
        promise: () => Promise.resolve(it).then(value => ({ key: index, value }))
    }))
    const result = [];
    const queue = indexedArr.splice(0, concurrency);
    while (queue.length) {
        const { key, value } = await Promise.race(queue.map(it => it.promise));
        const index = queue.findIndex(it => it.index === key);
        result[key] = value;
        queue.splice(index, 1);
        if (indexedArr.length) {
            queue.push(indexedArr.shift())
        }
    }
    return result
}