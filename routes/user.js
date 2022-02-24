const express = require("express");
const router = express.Router();
const Helpers = require("../helpers/Helpers");
const videoHelpers = require("../helpers/videoHelpers");
let jwt = require("jsonwebtoken");
let path = require("path");
const requestIp = require('request-ip');
 
// inside middleware handler
const ipMiddleware = function(req, res, next) {
    const clientIp = requestIp.getClientIp(req); 
    req.body.ip=clientIp
    next();
};
const { response } = require("express");
const verifyJWT = (req, res, next) => {
  console.log(req.body);
  const token = req.body.token;
  if (token == "null") {
    next()
  } else if (token) {
    jwt.verify(token, "secret", (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "Failed to authenticate" });
      } else {
        req.body.userId = decoded._id;
        next();
      }
    });
  }
};

/* GET home page. */
router.post("/", function (req, res) {
  const token = req.body.token;
  console.log('tooken',token);
  if (token == 'null'){
    // res.send("Not logined");
  } else if (token) {
    jwt.verify(token, "secret", (err, decoded) => {
      if (err) {
        console.log(err);
        res.json({ auth: false, message: "Not logined" });
      } else {
        req.body.userId = decoded._id;
        console.log("usere kiittie", req.body.userId);
        Helpers.getUser(req.body.userId).then((data) => {
          console.log("response", data);
          res.json(data);
        });
      }
    });
  }
});
router.post("/signup", (req, res) => {
  console.log(req.body);
  Helpers.doSignup(req.body)
    .then((data) => {
      let token = jwt.sign(data, "secret", { expiresIn: 6000000000000 });
      res.json({ token: token, user_id: data._id, username: data.name });
    })
    .catch(() => {
      res.json(false);
    });
});
router.post("/login", (req, res) => {
  console.log(req.body);
  Helpers.login(req.body)
    .then((response) => {
      if(response.Block){
res.json({block:true})
      }else{
        console.log(response);
        let token = jwt.sign(response, "secret", { expiresIn: 6000000000000 });
        res.json({
          token: token,
          user_id: response._id,
          username: response.name,
        });
      }
    })
    .catch(() => {
      res.json(false);
      console.log("illa");
    });
});
router.post("/createChannel",verifyJWT,(req, res) => {
  console.log(req.body,"kkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
  if(req.files.channelImage){
    var channelImage=req.files.channelImage
  }
  let data = req.body;
  data.userId = req.body.userId;
  Helpers.createChannel(req.body)
    .then((response) => {
      console.log('illa');
      if(channelImage){
        channelImage.mv("./public/ChannelImages/" + response._id + ".jpg")
      }
      res.json({ response });
    })
    .catch(() => {
      console.log("fsjvfsl");
      res.json(false);
    });
});
router.post("/upload-video", (req, res) => {
  let videoinformations = req.body;
  let video = req.files.file;
  let thumbanail = req.files.videothumbanail;
  videoHelpers.uploadVideo(videoinformations).then((response) => {
    video.mv("./public/Videos/" + response._id + ".mp4");
    thumbanail.mv("./public/Thumbanails/" + response._id + ".jpg");
    console.log("keri");
    // Helpers.sendNotification(response).then(()=>{

    // })
    res.json({ response: true });
});
})
router.post("/getChannel", verifyJWT, (req, res) => {
  console.log(req.body.userId);
  Helpers.getChannel(req.body.userId).then((response) => {
    res.json(response);
  });
});
router.post("/getVideos", (req, res) => {
  videoHelpers.getAll().then((response) => {
    res.json(response);
  });
});
router.post("/get-subscribers",verifyJWT,(req, res) => {
  videoHelpers.getSubscription(req.body.userId).then((response) => {
    res.json(response);
  });
});
router.post('/channel-videos',(req,res)=>{
    console.log("sdjs",req.body);
    videoHelpers.getChannelVideos(req.body.data).then((response)=>{
res.json(response);
    })
});
router.post('/subscribe',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let channelId=req.body.channelId
  Helpers.subscribe(channelId,userId).then((response)=>{
    res.json(response);
  })
});
router.post('/getSubscribers',verifyJWT,(req,res)=>{
  console.log(req.body);
Helpers.getSubscriberCount(req.body.channelId,req.body.userId).then((response)=>{
  res.json(response)
})
});
router.post('/unsubscribe',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let channelId=req.body.channelId
  Helpers.unsubscribe(channelId,userId).then((response)=>{
    res.json(response);
  })
});
router.post('/like',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let videoId=req.body.videoId
  Helpers.like(videoId,userId).then((response)=>{
    res.json(response)
  })
});

router.post('/unlike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let videoId=req.body.videoId
  Helpers.unlike(videoId,userId).then((response)=>{
    res.json(response)
  })
});
router.post('/getLikes',verifyJWT,(req,res)=>{
  console.log(req.body);
Helpers.getLikes(req.body.videoId,req.body.userId).then((response)=>{
  res.json(response)
})
});
router.post('/dislike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let videoId=req.body.videoId
  Helpers.dislike(videoId,userId).then((response)=>{
    res.json(response)
  })
});

router.post('/undislike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let videoId=req.body.videoId
  Helpers.undislike(videoId,userId).then((response)=>{
    res.json(response)
  })
});
router.post('/search',verifyJWT,(req,res)=>{
  Helpers.Search(req.body.input,req.body.userId).then((response)=>{
    res.json(response);
  })
})
router.post('/views',verifyJWT,(req,res)=>{
  console.log(req.body,"jjjjjjjjjjj");
  videoHelpers.views(req.body).then((response)=>{
  res.json(response)
  })
});
router.post('/related',(req,res)=>{
  videoHelpers.related(req.body.category,req.body.current).then((response)=>{
    res.json(response)
  })
});
router.post('/channelview',verifyJWT,(req,res)=>{
  console.log(req.body);
  Helpers.channelview(req.body.channelId,req.body.userId).then((response)=>{
    res.json(response);
  })
});
router.post('/channel_view-videos',(req,res)=>{
  console.log("sdjs",req.body);
  videoHelpers.getChannelViewVideos(req.body.data).then((response)=>{
res.json(response);
  })
});
router.post('/channel_view-playlist',(req,res)=>{
  console.log("sdjs",req.body);
  videoHelpers.getChannelViewPlaylist(req.body.data).then((response)=>{
res.json(response);
  })
});
router.post('/comment',verifyJWT,(req,res)=>{
console.log(req.body);
videoHelpers.AddComment(req.body).then((response)=>{
  res.json(response);
})
});
router.post('/getAllComment',verifyJWT,(req,res)=>{
  videoHelpers.kkkk(req.body).then((response)=>{
    console.log(response,"++++++++");
    res.json(response)
  })
});







router.post('/comment-like',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let commentId=req.body.commentId
  Helpers.commentlike(userId,commentId).then((response)=>{
    res.json(response)
  })
});

router.post('/comment-unlike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let commentId=req.body.commentId
  Helpers.commentunlike(userId,commentId).then((response)=>{
    res.json(response)
  })
});
router.post('/comment-getLikes',verifyJWT,(req,res)=>{
  console.log(req.body);
Helpers.commentgetLikes(req.body.videoId,req.body.userId).then((response)=>{
  res.json(response)
})
});
router.post('/comment-dislike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let commentId=req.body.commentId
  Helpers.commentdislike(userId,commentId).then((response)=>{
    res.json(response)
  })
});

router.post('/comment-undislike',verifyJWT,(req,res)=>{
  let userId=req.body.userId
  let commentId=req.body.commentId
  Helpers.commentundislike(userId,commentId).then((response)=>{
    res.json(response)
  })
});
router.post('/manageChannel',(req,res)=>{
  console.log("sdjs",req.body);
  videoHelpers.manageChannelVideos(req.body.data).then((response)=>{
res.json(response);
  })
});
router.post('/changevisibility',(req,res)=>{
  console.log(req.body);
videoHelpers.changeVisibility(req.body).then((response)=>{
res.json(response)
})
});
router.post('/changePlaylistvisibility',(req,res)=>{
  console.log(req.body);
videoHelpers.changePlaylistvisibility(req.body,req.body.channelId).then((response)=>{
res.json(response)
})
});
router.post('/edit-video',(req,res)=>{
  console.log(req.body);
  let thumbanail=req.files.videothumbanail
  thumbanail.mv("./public/Thumbanails/" + req.body.videoId+".jpg");
  videoHelpers.editVideos(req.body).then(()=>{
    res.json()
  })
});
router.post('/deletevideos',(req,res)=>{
  videoHelpers.deletevideos(req.body.videoId).then(()=>{
    res.json()
  })
});
router.post('/createPlaylist',(req,res)=>{
  console.log(req.body);

videoHelpers.createPlaylist(req.body).then((response)=>{
console.log(response);
res.json(response)
})
})
router.post('/getPlaylists',(req,res)=>{
  console.log(req.body);
  videoHelpers.getPlaylist(req.body.channelId).then((response)=>{
    console.log(response,"ffff");
    res.json(response);
  })
});
router.post('/addtoPlaylist',(req,res)=>{
  console.log(req.body);
  videoHelpers.addtoPlaylist(req.body).then((response)=>{

  console.log(response);
    res.json(response)
  })
})
router.post('/getPlaylistVideos',(req,res)=>{
  videoHelpers.getPlaylistVideos(req.body.playlistId).then((response)=>{
res.json(response)
  })
});
router.post('/enable',verifyJWT,(req,res)=>{
  let channelId=req.body.channelId;
  let userId=req.body.userId
  videoHelpers.enable(channelId,userId).then((response)=>{
    console.log(response);
  })
})
router.post('/disable',verifyJWT,(req,res)=>{
  let channelId=req.body.channelId;
  let userId=req.body.userId
  videoHelpers.disable(channelId,userId).then((response)=>{
    console.log(response);
  })
});
router.post('/getTheVideo',(req,res)=>{
  console.log(req.body);
  videoHelpers.getTheVideo(req.body.videoId).then((response)=>{
res.json(response)
  })
})
router.post("/report",verifyJWT,(req,res)=>{
  console.log(req.body);
  videoHelpers.report(req.body).then((response)=>{
    res.json(response)
  })
});
router.get('/ip',ipMiddleware,(req,res)=>{
console.log(req.body);
})

router.post('/liked-videos',verifyJWT,(req,res)=>{
  videoHelpers.likedVideos(req.body.userId).then((response)=>{
    res.json(response)
  })
});



module.exports = router;
