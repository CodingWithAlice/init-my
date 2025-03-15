import pLimit, { limitFunction } from 'p-limit';
const limit = pLimit(2);
const arr = Array.from({ length: 20 }, (it, index) => {
    return limit(() => new Promise(resolve => setTimeout(resolve, index * 100)))
})

const arr2 = Array.from({ length: 20 }, (it, index) => {
    return limitFunction(() => new Promise(resolve => setTimeout(resolve, index * 100)), { concurrency: 2 })
})

Promise.all(arr).then(res => res);
Promise.all(arr2).then(res => res);

// 源码实现
function validate(limit) { if (!Number.isInteger(limit) || limit < 0) { throw new Error('limit') } }
function pLimit1(concurrency) {
    validate(concurrency);
    const queue = [];
    let current = 0; // 1、可变变量，使用 let
    const next = () => {
        current--;
        if (queue.length) {
            queue.shift()();
        }
    }
    const run = async (resolve, fn, arg) => { // 2、run 执行函数的时候，要注意 fn 是异步函数
        current++;
        try {
            const res = await fn(...arg);
            resolve(res);
        } catch (e) {
            throw new Error('e') // 3、执行遇到错误时，抛出一个拒绝的 promise - resolve(Promise.reject(e))
        }
        next(); // 4、执行下一个任务
    }
    const generate = (cb, ...args) => {
        return new Promise((resolve) => {
            if (current < concurrency) {
                run(resolve, cb, args)
            } else {
                queue.push(run.bind(null, resolve, cb, args))
            }
        })
    }
    return generate;
}
// 使用Promise.race 来实现并发控制
async function execute(arr, concurrency = 0) {
    const indexedArr = arr.map((it, index) => {
        return { index, promise: it.then(value => ({ value, key: index })) }
    })
    const activeTasks = indexedArr.splice(0, concurrency);
    const result = [];
    while(activeTasks.length) {
        const {key ,value} = await Promise.race(activeTasks.map(it => it.promise));
        const currentIndex = activeTasks.findIndex(it => it.index === key);
        activeTasks.splice(currentIndex, 1);
        result[key] = value;
        if(indexedArr.length > 0) {
            activeTasks.push(indexedArr.shift())
        }
    }
    return result
}