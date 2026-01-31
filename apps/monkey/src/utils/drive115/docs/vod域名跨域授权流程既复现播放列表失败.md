# vod域名跨域授权流程既复现播放列表失败

## 复现路径

- 退出登录
- 重新登录
- 进入master播放器就会失败
- 进入115播放器就会成功

## 原因分析

115播放器会自动重新授权跨域token，master则不会

115授权流程分析

- 进入115播放器
- 发起请求 https://115vod.com/?pickcode=eu03yk1a3yp1dzzdt&share_id=0
- 上面的请求会被重定向 https://hnpassportapi.115.com/app/1.0/web/1.0/login/authToken?goto=https%253A%252F%252F115vod.com%252Fbridge%253Fgoto%253Dhttps%25253A%25252F%25252F115vod.com%25252F%25253Fpickcode%25253Deu03yk1a3yp1dzzdt%252526share_id%25253D0&time=1740252233&digest=xxxx
- 接着又被重定向到 https://115vod.com/bridge?goto=https%3A%2F%2F115vod.com%2F%3Fpickcode%3Deu03yk1a3yp1dzzdt%26share_id%3D0&auth_token=xxx
- 上面的请求会返回 cookie：xxx
- 获取到 cookie 后，又被重定向到 https://115vod.com/?pickcode=eu03yk1a3yp1dzzdt&share_id=0

## 解决办法

在 master 播放页中，提取发起跨域授权的请求
