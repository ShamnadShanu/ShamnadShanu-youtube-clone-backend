var db = require("../config/mongodb");
var collections = require("../config/collections");
const objectId = require("mongodb").ObjectID;
let bcrypt = require("bcrypt");
const e = require("express");
const { response } = require("express");
const { Timestamp, ObjectID } = require("bson");
const { COMMENT_COLLECTION, VIDEO_COLLECTION } = require("../config/collections");
module.exports = {
  uploadVideo: (data) => {
    data.timestamp = new Date();
    data.block=false
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .insertOne(data)
        .then((response) => {
          resolve(response.ops[0]);
        });
    });
  },
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .find({$and:[{ visibility: "20" },{block:false}]})
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getChannelVideos: (channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .find({ channelId: channelId })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  manageChannelVideos: (channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .find({ channelId: channelId })
        .toArray()
        .then((response) => {
          for (let i = 0; i < response.length; i++) {
            db.get()
              .collection(collections.COMMENT_COLLECTION)
              .find({ vId: String(response[i]._id) })
              .toArray()
              .then((comments) => {
                // console.log(comments);
                response[i].comments = comments;
                if (i == response.length - 1) {
                  resolve(response);
                }
              });
          }
        });
    });
  },

  // manageChannelVideos: (channelId) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.VIDEO_COLLECTION)
  //       .find({ channelId: channelId })
  //       .toArray()
  //       .then((response) => {
  //         resolve(response);
  //       });
  //   });
  // },
  views: (data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({
          $and: [{ _id: objectId(data.videoId) }, { views: data.userId }],
        });
      if (exist) {
        resolve(exist.views.length);
      } else {
        db.get()
          .collection(collections.VIDEO_COLLECTION)
          .findOne({ _id: objectId(data.videoId) })
          .then((response) => {
            if (response.views) {
              db.get()
                .collection(collections.VIDEO_COLLECTION)
                .updateOne(
                  { _id: objectId(data.videoId) },
                  {
                    $push: {
                      views: data.userId,
                    },
                  }
                )
                .then(() => {
                  db.get()
                    .collection(collections.VIDEO_COLLECTION)
                    .findOne({ _id: objectId(data.videoId) })
                    .then((final) => {
                      if (final.views) {
                        resolve({ views: final.views.length });
                      } else {
                        resolve({ views: 0 });
                      }
                    });
                });
            } else {
              db.get()
                .collection(collections.VIDEO_COLLECTION)
                .updateOne(
                  { _id: objectId(data.videoId) },
                  {
                    $set: {
                      views: [data.userId],
                    },
                  }
                )
                .then(() => {
                  db.get()
                    .collection(collections.VIDEO_COLLECTION)
                    .findOne({ _id: objectId(data.videoId) })
                    .then((final) => {
                      if (final.views) {
                        resolve({ views: final.views.length });
                      } else {
                        resolve({ views: 0 });
                      }
                    });
                });
            }
          });
      }
    });
  },
  related: (category, current) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .find({ $and: [{ category: category }, { title: { $ne: current } }] })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getChannelViewVideos: (channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .find({ $and: [{ visibility: "20" }, { channelId: channelId }] })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  getChannelViewPlaylist: (channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .find({ $and: [{ visibility: "20" }, { channelId: channelId }] })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  AddComment: (data) => {
    console.log(data, "lllllllllllllllllllllllll");
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTION)
        .findOne({ _id: objectId(data.userId) })
        .then((user) => {
          console.log(user);
          let comment = {
            userId: data.userId,
            vId: data.videoId,
            userProfile: user.profile,
            comment: data.Comment,
            userName: user.name,
            timestamp: new Date(),
          };
          db.get()
            .collection(collections.COMMENT_COLLECTION)
            .insertOne(comment)
            .then(() => {
              db.get()
                .collection(collections.COMMENT_COLLECTION)
                .find({ vId: data.videoId })
                .toArray()
                .then((response) => {
                  resolve(response);
                });
            });
        });
    });
  },
  kkkk: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = await db
        .get()
        .collection(collections.COMMENT_COLLECTION)
        .find({ vId: data.videoId })
        .toArray();
      if (data.userId) {
        for (let i = 0; i < response.length; i++) {
          if (response[i].likes == data.userId) {
            response[i].liked = true;
          } else if (response[i].dislikes == data.userId) {
            response[i].disliked = true;
          }
        }
      }

      resolve(response);
    });
  },
  changeVisibility: (para) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(para.videoId) },
          {
            $set: {
              visibility: para.visibility,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .find({ channelId: para.channelId })
            .toArray()
            .then((response) => {
              for (let i = 0; i < response.length; i++) {
                db.get()
                  .collection(collections.COMMENT_COLLECTION)
                  .find({ vId: String(response[i]._id) })
                  .toArray()
                  .then((comments) => {
                    // console.log(comments);
                    response[i].comments = comments;
                    if (i == response.length - 1) {
                      resolve(response);
                    }
                  });
              }
            });
        });
    });
  },
  changePlaylistvisibility: (para, channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .updateOne(
          { _id: objectId(para.playlistId) },
          {
            $set: {
              visibility: para.visibility,
            },
          }
        )
        .then((response) => {
          db.get()
            .collection(collections.PLAYLISTS_COLLECTION)
            .find({ channelId: channelId })
            .toArray()
            .then((response) => {
              console.log(response);
              resolve(response);
            });
        });
    });
  },
  editVideos: (updates) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .updateOne(
          { _id: objectId(updates.videoId) },
          {
            $set: {
              title: updates.title,
              discriiption: updates.discriiption,
              category: updates.category,
              visibility: updates.visibility,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  deletevideos: (videoId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .removeOne({ _id: objectId(videoId) })
        .then(() => {
          resolve();
        });
    });
  },
  createPlaylist: (playlist) => {
    playlist.lastUpdate = new Date();
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .findOne({ title: playlist.title })
        .then((response) => {
          console.log(response);
          if (!response) {
            db.get()
              .collection(collections.PLAYLISTS_COLLECTION)
              .insertOne(playlist)
              .then(() => {
                resolve(true);
              });
          } else {
            resolve(false);
          }
        });
    });
  },
  getPlaylist: (channelId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .find({ channeId: channelId })
        .toArray()
        .then((response) => {
          resolve(response);
        });
    });
  },
  addtoPlaylist: (data) => {
    return new Promise(async (resolve, reject) => {
      let playlist = await db
        .get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .findOne({ _id: objectId(data.playlistId) });
      console.log(playlist);
      if (playlist.videos) {
        let exist = await db
          .get()
          .collection(collections.PLAYLISTS_COLLECTION)
          .findOne({$and:[{ videos: objectId(data.videoId) },{_id:objectId(data.playlistId)}]});
        if (!exist) {
          db.get()
            .collection(collections.PLAYLISTS_COLLECTION)
            .updateOne(
              { _id: objectId(data.playlistId) },
              {
                $push: {
                  videos: objectId(data.videoId),
                },
                $set: {
                  lastUpdate: new Date(),
                },
              }
            )
            .then(() => {
              resolve(true);
            });
        } else {
          resolve(false);
        }
      } else {
        let exist = await db
          .get()
          .collection(collections.PLAYLISTS_COLLECTION)
          .findOne({$and:[{ videos: objectId(data.videoId) },{_id:objectId(data.playlistId)}]});
          if(!exist){
            db.get()
            .collection(collections.PLAYLISTS_COLLECTION)
            .updateOne(
              { _id: objectId(data.playlistId) },
              {
                $set: {
                  videos: [objectId(data.videoId)],
                  lastUpdate: new Date(),
                },
              }
            )
            .then(() => {
              resolve(true);
            });
          }else{
            resolve(false)
          }
      
      }
    });
  },
  getPlaylistVideos: (playlistId) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collections.PLAYLISTS_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(playlistId) },
          },
          {
            $project: {
              _id: 0,
              videos: "$videos",
            },
          },
          {
            $lookup: {
              from: collections.VIDEO_COLLECTION,
              localField: "videos",
              foreignField: "_id",
              as: "videos",
            },
          },
          {
            $unwind: "$videos",
          },
        ])
        .toArray();
      resolve(data);
    });
  },
  enable: (channelId, userId) => {
    return new Promise(async (resolve, reject) => {
      let notification = await db
        .get()
        .collection(collections.CHANNEL_COLLOCTION)
        .findOne({ _id: objectId(channelId) });
      console.log(notification, "fsgjsfl");
      if (userId) {
        let exist = await db
          .get()
          .collection(collections.CHANNEL_COLLOCTION)
          .findOne({
            $and: [
              { _id: objectId(channelId) },
              { notification: objectId(userId) },
            ],
          });
        if (exist) {
          resolve(exist.subscribers.length);
        } else {
          if (notification.notification) {
            db.get()
              .collection(collections.CHANNEL_COLLOCTION)
              .findOneAndUpdate(
                { _id: objectId(channelId) },
                {
                  $push: {
                    notification: objectId(userId),
                  },
                }
                // {$set:{subscribers:false}}
              )
              .then(() => {
                db.get()
                  .collection(collections.CHANNEL_COLLOCTION)
                  .findOne({ _id: objectId(channelId) })
                  .then((response) => {
                    console.log(response);
                    resolve(true);
                  });
              });
          } else {
            db.get()
              .collection(collections.CHANNEL_COLLOCTION)
              .findOneAndUpdate(
                { _id: objectId(channelId) },
                {
                  $set: {
                    subscribers: [objectId(userId)],
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
  disable: (channelId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHANNEL_COLLOCTION)
        .updateOne(
          { _id: objectId(channelId) },
          {
            $pull: { otification: userId },
          }
        )
        .then((response) => {
          resolve(false);
        });
    });
  },
  getTheVideo: (videoId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({ _id: objectId(videoId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  report: (body) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collections.VIDEO_COLLECTION)
        .findOne({$and:[{ reports: body.userId},{_id:objectId(body.videoId)}]});
      if (exist) {
        resolve(false);
      } else {
        let video = await db
          .get()
          .collection(collections.VIDEO_COLLECTION)
          .findOne({ _id: objectId(body.videoId) });
        if (video.reports) {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .updateOne(
              { _id: objectId(body.videoId) },
              {
                $push: {
                  reports: body.userId,
                },
              }
            ).then(()=>{
              resolve(true)
            })
        } else {
          db.get()
            .collection(collections.VIDEO_COLLECTION)
            .updateOne(
              { _id: objectId(body.videoId) },
              {
                $set: {
                  reports: [body.userId],
                },
              }
            ).then(()=>{
              resolve(true)
            })
        }
      }
    });
  },
  getAllReported:()=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.VIDEO_COLLECTION).find( {reports : {$exists:true}, $where:'this.reports.length>0'} ).toArray().then((response)=>{
        resolve(response);
      })
    })
  },
  likedVideos:(userId)=>{
    console.log(userId);
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.VIDEO_COLLECTION).find({likes:userId}).toArray().then((response)=>{
        console.log(response,'videosith');
        resolve(response)
      })
    })
  },
  // getSubscription: () => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collections.VIDEO_COLLECTION)
  //       .find({$and:[{ visibility: "20" },{block:false},{}]})
  //       .toArray()
  //       .then((response) => {
  //         resolve(response);
  //       });
  //   });
  // },
  getSubscription: (userId) => {
    return new Promise((resolve, reject) => {
     
      db.get().collection(collections.CHANNEL_COLLOCTION).aggregate([{
        $match:{
          subscribers:userId
        }
      }
    ]).toArray().then((response)=>{
      console.log(response,"=================================================");
      resolve(response)
    })
    })
  },
Verify:(channelId)=>{
return new Promise((resolve,reject)=>{
  db.get().collection(collections.CHANNEL_COLLOCTION).updateOne({_id:objectId(channelId)},{
    $set:{
      verified:true
    }
  }).then(()=>{
    db.get().collection(collections.CHANNEL_COLLOCTION).find().toArray().then((response)=>{
      resolve(response)
    })
  })
})
}
}
