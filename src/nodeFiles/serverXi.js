// 第一步：请求node.js自带的http模块
// 第二步：创建服务器，使用http模块中的createServer方法，创建一个服务
// 第三步：使用listen方法监听端口号，'0.0.0.0'是监听服务器的所有端口。
var http = require("http");
const server = http.createServer(function (request, response) {
    // 发送 HTTP 头部
    // HTTP 状态值 200:ok
    // 内容类型 text/plain
    response.writeHead(200, {'Content-Type': 'text/plain'});

    // 发送响应数据 “hello 易烊千玺”
    response.end('hello 易烊千玺');
})

server.listen(8081, '0.0.0.0', () => {
    console.log('server is running at http://0.0.0.0:8081');
})