var db = require("../config/mongodb");
var collections = require("../config/collections");
const objectId = require("mongodb").ObjectID;
let bcrypt = require("bcrypt");
const e = require("express");
const { response } = require("express");
const { exists } = require("fs");
const { resource } = require("../app");
const { resolve } = require("path");

module.exports = {
  doSignup: (Data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: Data.email });
      if (!exist) {
        if (Data.method != "Normal") {
          db.get()
            .collection(collections.USER_COLLECTION)
            .insertOne(Data)
            .then((data) => {
              resolve(data.ops[0]);
            });
        } else {
          Data.password = await bcrypt.hash(Data.password, 10);
          db.get()
            .collection(collections.USER_COLLECTION)
            .insertOne(Data)
            .then((data) => {
              resolve(data.ops[0]);
            });
        }
      } else {
        console.log("ketoola");
        reject();
      }
    });
  },
  getUser: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .findOne({ _id: objectId(data) })
        .then(async (user) => {
          let channel = await db
            .get()
            .collection(collections.CHANNEL_COLLOCTION)
            .findOne({ userId: data });
          if (channel) {
            console.log("channel uunt");
            user.channel = channel;
            resolve(user);
          } else {
            console.log("channel illa");
            resolve(user);
          }
        });
    });
  },
  login: (data) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ email: data.email });
      if (user) {
        if (user.block) {
          resolve({ Block: true });
        } else {
          if (user.method != "Normal") {
            resolve(user);
          } else {
            bcrypt.compare(data.password, user.password).then((status) => {
              if (status) {
                console.log("mm kerikko");
                resolve(user);
              } else {
                reject();
                console.log("mm pokko");
              }
            });
          }
        }
      } else {
        reject();
      }
    });
  },
  adminLogin: (data) => {
    let admin = {
      email: "shamnad@gmail.com",
      password: "1234",
    };
    return new Promise((resolve, reject) => {
      if (admin.email == data.email && admin.password == data.password) {
        resolve();
      } else {
        reject();
      }
    });
  },
  getAllUser: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .find()
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getAllChannels: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .find()
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  blockVideo: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              block: true,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .find({
              reports: { $exists: true },
              $where: "this.reports.length>0",
            })
            .toArray()
            .then((response) => {
              resolve(response);
            });
        });
    });
  },
  unbockVideo: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              block: false,
            },
          }
        )
        .then(() => {
          db.get();
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .find({
              reports: { $exists: true },
              $where: "this.reports.length>0",
            })
            .toArray()
            .then((response) => {
              resolve(response);
            });
        });
    });
  },
  blockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              block: true,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.USER_COLLECTION)
            .find()
            .toArray()
            .then((response) => {
              resolve(response);
            });
        });
    });
  },
  unbockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              block: false,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.USER_COLLECTION)
            .find()
            .toArray()
            .then((response) => {
              resolve(response);
            });
        });
    });
  },
  createChannel: (data) => {
    data.token=undefined
    delete(data.token)
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ channelName: data.channelName });
      if (!exist) {
        db.get()
          .collection(collections.CHANNEL_COLLOCTION)
          .insertOne(data)
          .then((response) => {
            resolve(response.ops[0]);
          });
      } else {
        console.log(exist,"lllllllllll");
        reject();
      }
    });
  },
  getChannel: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ userId: userId })
        .then((response) => {
          resolve(response);
        });
    });
  },
  subscribe: (channelId, userId) => {
    return new Promise(async (resolve, reject) => {
      let subscribers = await db
        .get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ _id: objectId(channelId) });
      console.log(subscribers, "fsgjsfl");
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.CHANNEL_COLLOCTION)
          .findOne({
            $and: [{ _id: objectId(channelId) }, { subscribers: userId }],
          });
        if (exist) {
          resolve(exist.subscribers.length);
        } else {
          if (subscribers.subscribers) {
            db.get()
              .collection(collections.CHANNEL_COLLOCTION)
              .findOneAndUpdate(
                { _id: objectId(channelId) },
                {
                  $push: {
                    subscribers: userId,
                  },
                }
                // {$set:{subscribers:false}}
              )
              .then(() => {
                db.get()
                  .collection(collections.CHANNEL_COLLOCTION)
                  .findOne({ _id: objectId(channelId) })
                  .then((response) => {
                    console.log(response.subscribers.length);
                    resolve(response.subscribers.length);
                  });
              });
          } else {
            db.get()
              .collection(collections.CHANNEL_COLLOCTION)
              .findOneAndUpdate(
                { _id: objectId(channelId) },
                {
                  $set: {
                    subscribers: [userId],
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.CHANNEL_COLLOCTION)
                  .findOne({ _id: objectId(channelId) })
                  .then((response) => {
                    console.log(response.subscribers.length);
                    resolve(response.subscribers.length);
                  });
              });
          }
        }
      }
    });
  },
  getSubscriberCount: (channelId, userId) => {
    let subscribed = false;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ _id: objectId(channelId) })
        .then((response) => {
          console.log("sssssssssss", response);
          if (response.subscribers) {
            if (userId) {
              for (let i = 0; i <= response.subscribers.length; i++) {
                if (response.subscribers[i] == userId) {
                  subscribed = true;
                  break;
                }
              }
            }
            if (subscribed) {
              console.log("unt");
              resolve({
                response: response.subscribers.length,
                subscribed: true,
              });
            } else {
              console.log("illla");
              resolve({ response: response.subscribers.length });
            }
          } else {
            resolve({ response: 0 });
          }
        });
    });
  },
  unsubscribe: (channelId, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .updateOne(
          { _id: objectId(channelId) },
          {
            $pull: { subscribers: userId },
          }
        )
        .then((response) => {
          db.get()
            .collection(collections.CHANNEL_COLLOCTION)
            .findOne({ _id: objectId(channelId) })
            .then((response) => {
              resolve(response.subscribers.length);
            });
        });
    });
  },
  like: (videoId, userId) => {
    return new Promise(async (resolve, reject) => {
      let video = await db
        .get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({ _id: objectId(videoId) });
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.VIDEO_COLLECTION)
          .findOne({ $and: [{ _id: objectId(videoId) }, { likes: userId }] });
        if (exist) {
          if (exist.dislikes) {
            resolve({
              like: exist.likes.length,
              dislike: exist.dislikes.length,
            });
          } else {
            resolve({ like: exist.likes.length, dislike: 0 });
          }
        } else {
          if (video.likes) {
            db.get()
              .collection(collections.VIDEO_COLLECTION)
              .updateOne(
                { _id: objectId(videoId) },
                {
                  $push: {
                    likes: userId,
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.VIDEO_COLLECTION)
                  .updateOne(
                    { _id: objectId(videoId) },
                    {
                      $pull: {
                        dislikes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.VIDEO_COLLECTION)
                      .findOne({ _id: objectId(videoId) })
                      .then((response) => {
                        console.log(response.likes.length);
                        if (response.dislikes) {
                          resolve({
                            like: response.likes.length,
                            dislike: response.dislikes.length,
                          });
                        } else {
                          resolve({ like: response.likes.length, dislike: 0 });
                        }
                      });
                  });
              });
          } else {
            db.get()
              .collection(collections.VIDEO_COLLECTION)
              .updateOne(
                { _id: objectId(videoId) },
                {
                  $set: {
                    likes: [userId],
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.VIDEO_COLLECTION)
                  .findOne({ _id: objectId(videoId) })
                  .then((response) => {
                    console.log(response.likes.length);
                    if (response.dislikes) {
                      resolve({
                        like: response.likes.length,
                        dislike: response.dislikes.length,
                      });
                    } else {
                      resolve({ like: response.likes.length, dislike: 0 });
                    }
                  });
              });
          }
        }
      }
    });
  },
  unlike: (videoId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(videoId) },
          {
            $pull: {
              likes: userId,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .findOne({ _id: objectId(videoId) })
            .then((response) => {
              console.log(response.likes.length);
              if (response.dislikes) {
                resolve({
                  like: response.likes.length,
                  dislike: response.dislikes.length,
                });
              } else {
                resolve({ like: response.likes.length, dislike: 0 });
              }
            });
        });
    });
  },
  getLikes: (videoId, userId) => {
    let Liked = false;
    let disLiked = false;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({ _id: objectId(videoId) })
        .then((response) => {
          console.log("sssssssssss", response);
          if (response.likes) {
            if (userId) {
              for (let i = 0; i <= response.likes.length; i++) {
                if (response.likes[i] == userId) {
                  Liked = true;
                  break;
                } else {
                  for (let i = 0; i <= response.dislikes.length; i++) {
                    if (response.dislikes[i] == userId) {
                      disLiked = true;
                    }
                  }
                }
              }
            }
            if (Liked) {
              if (response.dislikes) {
                resolve({
                  response: {
                    like: response.likes.length,
                    dislike: response.dislikes.length,
                  },
                  liked: true,
                });
              } else {
                resolve({
                  response: { like: response.likes.length, dislike: 0 },
                  liked: true,
                });
              }
            } else if (disLiked) {
              resolve({
                response: {
                  like: response.likes.length,
                  dislike: response.dislikes.length,
                },
                disliked: true,
              });
            } else {
              console.log("illla");
              resolve({
                response: {
                  like: response.likes.length,
                  dislike: response.dislikes.length,
                },
              });
            }
          } else {
            resolve({ response: { like: 0, dislike: 0 } });
          }
        });
    });
  },
  dislike: (videoId, userId) => {
    return new Promise(async (resolve, reject) => {
      let video = await db
        .get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({ _id: objectId(videoId) });
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.VIDEO_COLLECTION)
          .findOne({
            $and: [{ _id: objectId(videoId) }, { dislikes: userId }],
          });
        if (exist) {
          if (exist.likes) {
            resolve({
              like: exist.likes.length,
              dislike: exist.dislikes.length,
            });
          } else {
            resolve({ like: 0, dislike: exist.dislikes.length });
          }
        } else {
          if (video.dislikes) {
            db.get()
              .collection(collections.VIDEO_COLLECTION)
              .updateOne(
                { _id: objectId(videoId) },
                {
                  $push: {
                    dislikes: userId,
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.VIDEO_COLLECTION)
                  .updateOne(
                    { _id: objectId(videoId) },
                    {
                      $pull: {
                        likes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.VIDEO_COLLECTION)
                      .findOne({ _id: objectId(videoId) })
                      .then((response) => {
                        console.log(response.dislikes.length);
                        if (response.likes) {
                          resolve({
                            like: response.likes.length,
                            dislike: response.dislikes.length,
                          });
                        } else {
                          resolve({
                            like: 0,
                            dislike: response.dislikes.length,
                          });
                        }
                      });
                  });
              });
          } else {
            db.get()
              .collection(collections.VIDEO_COLLECTION)
              .updateOne(
                { _id: objectId(videoId) },
                {
                  $set: {
                    dislikes: [userId],
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.VIDEO_COLLECTION)
                  .updateOne(
                    { _id: objectId(videoId) },
                    {
                      $pull: {
                        likes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.VIDEO_COLLECTION)
                      .findOne({ _id: objectId(videoId) })
                      .then((response) => {
                        console.log(response.dislikes.length);
                        if (response.likes) {
                          resolve({
                            like: response.likes.length,
                            dislike: response.dislikes.length,
                          });
                        } else {
                          resolve({
                            like: 0,
                            dislike: response.dislikes.length,
                          });
                        }
                      });
                  });
              });
          }
        }
      }
    });
  },
  undislike: (videoId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(videoId) },
          {
            $pull: {
              dislikes: userId,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .findOne({ _id: objectId(videoId) })
            .then((response) => {
              console.log(response.dislikes.length);
              if (response.likes) {
                resolve({
                  like: response.likes.length,
                  dislike: response.dislikes.length,
                });
              } else {
                resolve({ like: 0, dislike: response.dislikes.length });
              }
            });
        });
    });
  },
  Search: (input, userId) => {
    let subscribed = false;
    return new Promise(async (resolve, reject) => {
      if (input) {
        let result = await db
          .get()
          .collection(collections.VIDEO_COLLECTION)
          .find({ title: { $regex: input, $options: "$i" } })
          .toArray();
        let channel = await db
          .get()
          .collection(collections.CHANNEL_COLLOCTION)
          .findOne({ channelName: { $regex: input, $options: "$i" } });
        if (userId) {
          if (channel) {
            for (let i = 0; i < channel.subscribers.length; i++) {
              if (channel.subscribers[i] == userId) {
                subscribed = true;
              }
            }
          }
        }
        db.get().collection(collections.VIDEO_COLLECTION).find({channelName:channel.channelName}).toArray().then((count)=>{
          console.log(count);
          resolve({ result: result, channel: channel, subscribed: subscribed,count:count.length });
        })
      } else {
        resolve([]);
      }
    });
  },
  channelview: (channelId, userId) => {
    let subscribed = false;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ _id: objectId(channelId) })
        .then((response) => {
          if(response.subscribers){
           if(userId){
            for (let i = 0; i < response.subscribers.length; i++) {
              if (response.subscribers[i] == userId) {
                subscribed = true;
              }
            }
            resolve({ response: response, subscribed: subscribed });
           }else{
            resolve({response:response,subscribed:false})
           }
          }else{
resolve({response:response,subscribed:false})
          }
        });
    });
  },

  commentlike: (userId, commentId) => {
    return new Promise(async (resolve, reject) => {
      let Comment = await db
        .get()
        .collection(collections.COMMENT_COLLECTION)
        .findOne({ _id: objectId(commentId) });
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.COMMENT_COLLECTION)
          .findOne({ $and: [{ _id: objectId(commentId) }, { likes: userId }] });
        if (exist) {
          db.get()
            .collection(collections.COMMENT_COLLECTION)
            .findOne({ _id: objectId(commentId) })
            .then((response) => {
              db.get()
                .collection(collections.COMMENT_COLLECTION)
                .find({ vId: response.vId })
                .toArray()
                .then((response) => {
                  for (let i = 0; i < response.length; i++) {
                    if (response[i].likes == userId) {
                      response[i].liked = true;
                    } else if (response[i].dislikes == userId) {
                      response[i].disliked = true;
                    }
                  }
                  resolve(response);
                });
            });
        } else {
          if (Comment.likes) {
            db.get()
              .collection(collections.COMMENT_COLLECTION)
              .updateOne(
                { _id: objectId(commentId) },
                {
                  $push: {
                    likes: userId,
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.COMMENT_COLLECTION)
                  .updateOne(
                    { _id: objectId(commentId) },
                    {
                      $pull: {
                        dislikes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.COMMENT_COLLECTION)
                      .findOne({ _id: objectId(commentId) })
                      .then((response) => {
                        db.get()
                          .collection(collections.COMMENT_COLLECTION)
                          .findOne({ _id: objectId(commentId) })
                          .then((response) => {
                            db.get()
                              .collection(collections.COMMENT_COLLECTION)
                              .find({ vId: response.vId })
                              .toArray()
                              .then((response) => {
                                for (let i = 0; i < response.length; i++) {
                                  if (response[i].likes == userId) {
                                    response[i].liked = true;
                                  } else if (response[i].dislikes == userId) {
                                    response[i].disliked = true;
                                  }
                                }
                                resolve(response);
                              });
                          });
                      });
                  });
              });
          } else {
            db.get()
              .collection(collections.COMMENT_COLLECTION)
              .updateOne(
                { _id: objectId(commentId) },
                {
                  $set: {
                    likes: [userId],
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.COMMENT_COLLECTION)
                  .updateOne(
                    { _id: objectId(commentId) },
                    {
                      $pull: {
                        dislikes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.COMMENT_COLLECTION)
                      .findOne({ _id: objectId(commentId) })
                      .then((response) => {
                        db.get()
                          .collection(collections.COMMENT_COLLECTION)
                          .find({ vId: response.vId })
                          .toArray()
                          .then((response) => {
                            for (let i = 0; i < response.length; i++) {
                              if (response[i].likes == userId) {
                                response[i].liked = true;
                              } else if (response[i].dislikes == userId) {
                                response[i].disliked = true;
                              }
                            }
                            resolve(response);
                          });
                      });
                  });
              });
          }
        }
      }
    });
  },
  commentunlike: (userId, commentId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMMENT_COLLECTION)
        .updateOne(
          { _id: objectId(commentId) },
          {
            $pull: {
              likes: userId,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.COMMENT_COLLECTION)
            .findOne({ _id: objectId(commentId) })
            .then((response) => {
              db.get()
                .collection(collections.COMMENT_COLLECTION)
                .find({ vId: response.vId })
                .toArray()
                .then((response) => {
                  for (let i = 0; i < response.length; i++) {
                    if (response[i].likes == userId) {
                      response[i].liked = true;
                    } else if (response[i].dislikes == userId) {
                      response[i].disliked = true;
                    }
                  }
                  resolve(response);
                });
            });
        });
    });
  },
  //          commentgetLikes:(videoId,userId)=>{
  //             let Liked=false;
  //             let disLiked=false
  //       return new Promise((resolve,reject)=>{
  //          db.get().collection(collections.VIDEO_COLLECTION).findOne({_id:objectId(videoId)}).then((response)=>{
  //             console.log('sssssssssss',response);
  //            if(response.likes){
  //            if(userId){
  //             for(let i=0;i<=response.likes.length;i++){
  //                if(response.likes[i]==userId){
  //                   Liked=true
  //                break;
  //                }else{
  //                   for(let i=0;i<=response.dislikes.length;i++){
  //                      if(response.dislikes[i]==userId){
  //                         disLiked=true
  //                      }
  //                   }
  //                }
  //             }
  //            }
  //             if(Liked){
  //                if(response.dislikes){
  //                   resolve({response:{like:response.likes.length,dislike:response.dislikes.length},liked:true})
  //                }
  //                else{
  //                   resolve({response:{like:response.likes.length,dislike:0},liked:true})

  //                   }
  //             }else if (disLiked){
  //                resolve({response:{like:response.likes.length,dislike:response.dislikes.length},disliked:true})
  //             }else{
  //                console.log('illla');
  //                resolve({response:{like:response.likes.length,dislike:response.dislikes.length}})
  //             }
  //            }else{
  //             resolve({response:{like:0,dislike:0}})
  //            }
  //          })
  //       })
  //          },
  commentdislike: (userId, commentId) => {
    return new Promise(async (resolve, reject) => {
      let video = await db
        .get()
        .collection(collections.COMMENT_COLLECTION)
        .findOne({ _id: objectId(commentId) });
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.COMMENT_COLLECTION)
          .findOne({
            $and: [{ _id: objectId(commentId) }, { dislikes: userId }],
          });
        if (exist) {
          db.get()
            .collection(collections.COMMENT_COLLECTION)
            .findOne({ _id: objectId(commentId) })
            .then((response) => {
              db.get()
                .collection(collections.COMMENT_COLLECTION)
                .find({ vId: response.vId })
                .toArray()
                .then((response) => {
                  for (let i = 0; i < response.length; i++) {
                    if (response[i].likes == userId) {
                      response[i].liked = true;
                    } else if (response[i].dislikes == userId) {
                      response[i].disliked = true;
                    }
                  }
                  resolve(response);
                });
            });
        } else {
          if (video.dislikes) {
            db.get()
              .collection(collections.COMMENT_COLLECTION)
              .updateOne(
                { _id: objectId(commentId) },
                {
                  $push: {
                    dislikes: userId,
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.COMMENT_COLLECTION)
                  .updateOne(
                    { _id: objectId(commentId) },
                    {
                      $pull: {
                        likes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.COMMENT_COLLECTION)
                      .findOne({ _id: objectId(commentId) })
                      .then((response) => {
                        db.get()
                          .collection(collections.COMMENT_COLLECTION)
                          .find({ vId: response.vId })
                          .toArray()
                          .then((response) => {
                            for (let i = 0; i < response.length; i++) {
                              if (response[i].likes == userId) {
                                response[i].liked = true;
                              } else if (response[i].dislikes == userId) {
                                response[i].disliked = true;
                              }
                            }
                            resolve(response);
                          });
                      });
                  });
              });
          } else {
            db.get()
              .collection(collections.COMMENT_COLLECTION)
              .updateOne(
                { _id: objectId(commentId) },
                {
                  $set: {
                    dislikes: [userId],
                  },
                }
              )
              .then(() => {
                db.get()
                  .collection(collections.COMMENT_COLLECTION)
                  .updateOne(
                    { _id: objectId(commentId) },
                    {
                      $pull: {
                        likes: userId,
                      },
                    }
                  )
                  .then(() => {
                    db.get()
                      .collection(collections.COMMENT_COLLECTION)
                      .findOne({ _id: objectId(commentId) })
                      .then((response) => {
                        db.get()
                          .collection(collections.COMMENT_COLLECTION)
                          .find({ vId: response.vId })
                          .toArray()
                          .then((response) => {
                            for (let i = 0; i < response.length; i++) {
                              if (response[i].likes == userId) {
                                response[i].liked = true;
                              } else if (response[i].dislikes == userId) {
                                response[i].disliked = true;
                              }
                            }
                            resolve(response);
                          });
                      });
                  });
              });
          }
        }
      }
    });
  },
  commentundislike: (userId, commentId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.COMMENT_COLLECTION)
        .updateOne(
          { _id: objectId(commentId) },
          {
            $pull: {
              dislikes: userId,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.COMMENT_COLLECTION)
            .findOne({ _id: objectId(commentId) })
            .then((response) => {
              db.get()
                .collection(collections.COMMENT_COLLECTION)
                .find({ vId: response.vId })
                .toArray()
                .then((response) => {
                  for (let i = 0; i < response.length; i++) {
                    if (response[i].likes == userId) {
                      response[i].liked = true;
                    } else if (response[i].dislikes == userId) {
                      response[i].disliked = true;
                    }
                  }
                  resolve(response);
                });
            });
        });
    });
  },
  sendNotification: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .aggregate([
          {
            $unwind: "$notification",
          },
        ]);
    });
  },
};
