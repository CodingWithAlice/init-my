setTimeout(() => {
    console.log("time1");
    process.nextTick(()=>{
        console.log("nextTick2");
    });
}, 0);
console.log("start")
process.nextTick(()=>{
    console.log("nextTick1");
    setTimeout(()=>{
        console.log("time2");
    });
});
// 上述代码输出结果：start  nextTick1 time1 nextTick2 time2