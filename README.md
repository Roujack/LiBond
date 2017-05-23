# LiBond
email：2317809590@qq.com
一个基于帖子的校园互助交友平台。人们需要使用这个平台首先需要使用手机号注册一个账户。注册以后会得到30个虚拟币（荔枝）。用户（A）可以使用荔枝在该平台上发布
一个帖子寻求帮助。其他用户(B)如果对用户A的帖子感兴趣，可以报名该帖子成为任务人。当完成了任务以后，A需要支付给定的荔枝给B。此外用户也可以通过签到获得荔枝。
用户在这个平台上可以利用空闲的时间帮助别人，也可以从中获取帮助。在这个过程中，可能使互不相识的人成为好朋友。该平台也会发起用荔枝兑换奖品的活动来吸引用户。
## 应用场景
我们在高校中经常会遇到一些问题，比如说自己在校外却收到快递公司的收货短信、天气很好想找个伴去游泳、因为有事希望去食堂打包。这些都是很常见的需求。很多时候，
其他人也刚好想去游泳，或者他刚好就在快递领取点，可以很方便地帮你拿回快递。但是高校却没有一个很好的解决方案。因此我们就想要做这样一个产品，营造更好的校园
氛围。

## 技术架构
该产品采用前后端分离的方式进行构建。前端可以是APP和网页（包括移动web应用）。后端使用nodejs的Express框架编写接口，数据使用MongoDB进行存储。此外还使用
redis存储一些用户验证的数据。前端通过调用后端的接口进行数据交换。我负责后端接口的开发，这里也只是展示后端的具体实现过程。如果你对具体实现技术或者这个
项目感兴趣的话，欢迎和我联系。

## APP功能展示
打开APP会进入登录界面，如果用户没有账号，需要注册：

![登录界面](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161817.jpg)

登录以后，将会进入APP主界面，可以看到，APP分为五大板块：互助圈、任务、推送、聊天、通知。

![主界面](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161821.jpg)

### 个人中心
点击头像，会进入个人中心：

![个人中心，管理用户自己的一些信息](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161807.jpg)

![查看我的钱包](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161837.jpg)

在我的钱包下面，有libond商城，是用来兑换奖品的。用户可以拿荔枝兑换喜欢的物品：

![liBond商城](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161843.jpg)

### 互助圈
在互助圈，可以发布帖子，也可以浏览别人发布的帖子，并领取感兴趣的任务：

![发布一个帖子](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161826.jpg)

![浏览帖子](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161831.jpg)

### 任务
在任务一栏，分我领取的任务以及我发布的帖子两个部分：

![我发布的帖子](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161854.jpg)

### 推送
推送是指平台中心希望发布给所有用户的文章。比如平台使用手册：

![推送界面](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161858.jpg)

### 聊天
聊天栏是用户对帖子感兴趣的时候，可以对发帖人进行询问。

![聊天界面](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161908.jpg)

### 通知
通知栏为系统给用户的信息，比如用户报名你的帖子啊，以及你的帖子被举报啊，还有其他信息等：
![系统通知](https://github.com/Roujack/LiBond/blob/master/pictures/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20170523161912.jpg)

