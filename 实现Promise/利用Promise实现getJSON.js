const getJSON = function(url) {
	const promise = new Promise((resolve, reject) => {
		const client = new XMLHttpRequest();
		client.open('GET', url);
		client.onreadystatechange = function() {
			if (this.readyState !== 4) {
				return;
			}
			if (this.status === 200) {
				resolve(this.response);
			} else  {
				reject(new Error(this.statusText));
			}
		};
		client.responseType = 'json'; // 告诉服务器以什么格式返回
		client.setRequestHeader('Accept', 'application/json'); // 用户代理可处理的媒体类型
		client.send();
	});

	return promise;
};