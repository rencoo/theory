function ajax({url='', type='get',dataType='json'}) { // ES6 默认赋值
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        xhr.responseType = dataType;
        xhr.onload = function () { // xhr.readState = 4, xhr.status = 200
            if(xhr.status == 200)
                resolve(xhr.response)  // 成功调用成功的方法
            else   
                reject('not found')
        };
        xhr.send(null);
    })
}

// ajax({url:'',data:{},type:'get',dataType:'json'}).then((res)=>{
//     console.log(res)
// },(err)=>{
//     console.log(err)
// })
