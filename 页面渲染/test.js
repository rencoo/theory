// 这段脚本至少执行 5s
function longCode() {
    var tStart = Number(new Date());
    while((tStart + 5000) > Number(new Date())) {
        console.log("继续执行");
    }
}

longCode();