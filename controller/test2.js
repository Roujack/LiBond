posts.forEach(function (post) {
                UserDao.getUserById(post.publisher,function (err,user) {
                    if(err){
                        reject("帖子"+post._id+"发布者查找失败导致自动转账失败");
                    }else if(!user){
                        reject("帖子"+post._id+"发布者不存在导致自动转账失败");
                    }else if(user.frozen==1){
                        UserDao.getUserById(post.coinBank.fromId,function (err,fromUser) {
                            if(err){
                                reject("帖子"+post._id+"交易者查找失败导致自动转账失败");
                            } else{
                                UserDao.getUserById(post.coinBank.toId,function (err,toUser) {
                                    if(err){
                                        reject("帖子"+post._id+"交易者查找失败导致自动转账失败");
                                    } else if(!fromUser||!toUser){
                                        reject("帖子"+post._id+"交易者不存在导致自动转账失败");
                                    }else if(fromUser.frozen==0||toUser.frozen==0){
                                        reject.reject("帖子"+post._id+"交易者被冻结不能正常进行自动转账");
                                    }else{
                                        if(fromUser.coin<post.missionCoin){
                                            console.log("帖子"+post._id+"交易者"+fromUser.stuName+"时间币不够不能正常进行自动转账");
                                        }
                                        fromUser.coin=fromUser.coin-post.coinBank.coin;
                                        fromUser.save(function (err) {
                                            if(err){
                                                reject("帖子"+post._id+"交易者"+fromUser.stuName+"保存失败不能正常进行自动转账");
                                            }else{
                                                toUser.coin=toUser.coin+post.coinBank.coin;
                                                toUser.message.addToSet({
                                                    date : new Date(),            //信息时间
                                                    messageType: 4 ,
                                                    content :{
                                                        userId  :fromUser._id ,      //信息触发者id
                                                        postId :post._id,        //帖子id
                                                        userStuName :fromUser.stuName ,  //信息触发者姓名
                                                        postTitle :post.title      //帖子标题
                                                    }
                                                });
                                                toUser.save(function(err){
                                                    if(err){
                                                        reject("帖子"+post._id+"交易者"+toUser.stuName+"保存失败不能正常进行自动转账");
                                                    }else{
                                                        post.participant.forEach(function (p) {
                                                            p.status= 4;
                                                        });
                                                        post.status=5;
                                                        post.coinBank.status=1;
                                                        post.save(function (err) {
                                                            if(err){
                                                                reject("帖子"+post._id+"保存失败不能正常进行自动转账");
                                                            }else{
                                                                resolve("帖子"+post._id+"交易进行自动转账成功");
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                        });
                                    }
                                })
                            }
                        })
                    }else if(user.frozen==0){
                        reject(post._id+"帖子发布者被冻结不能正常进行自动转账");
                    }
                });
            });