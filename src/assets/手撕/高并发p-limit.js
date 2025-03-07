import pLimit from 'p-limit';

// 创建一个限制器实例，设置并发限制为 2
const limit = pLimit(2);

// 模拟异步任务
const asyncTask = (id) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Task ${id} completed`);
            resolve(id);
        }, 1000);
    });
};

// 创建任务数组
const tasks = Array.from({ length: 5 }, (_, index) =>
    limit(() => asyncTask(index + 1))
);

// 执行所有任务
Promise.all(tasks).then((results) => {
    console.log('All tasks completed:', results);
});