var time = 0
exports.time = time // 导出是份拷贝值
setInterval(() => time++, 1000)
